// Génère un cerfa : son DTO traduit dans les noms du gabarit, le formulaire
// rempli puis aplati par le PDF (`cerfa-pdf.port.ts`).
//
// Le cerfa ne sait pas d'où viennent ses données : il reçoit son DTO, que le
// simulateur calcule (`cerfa-dto.service.ts`), et qu'une autre source pourrait
// calculer.
//
// Ce fichier garde la règle du cerfa : l'ordre des opérations, ce qui fait d'un
// PDF un aperçu, sa marque. Le PDF, lui, exécute : il ne décide de rien.

import type { CerfaDto } from "../../../core/socle/cerfa";
import type {
  BoxBinding,
  Cerfa,
  DrawingBinding,
  StrictTextBinding,
  TextBinding,
  Typography,
} from "./cerfa.types";
import type { CerfaPdf } from "./cerfa-pdf.port";
import type {
  Drawing,
  FieldEntry,
  Filled,
  Flattened,
  Mark,
  StrictLineMeasure,
  StrictOverflow,
} from "./cerfa-pdf.types";
import { StrictEntriesService } from "./strict-entries.service";
import { TEXT_SIZES } from "./text-sizes.constants";
import { TypographyService } from "./typography.service";

/**
 * Le cerfa généré, les textes stricts qui en débordent, et la taille de ses
 * textes imprimés. Un texte strict qui déborde fait du PDF un aperçu.
 */
export type GeneratedCerfa = {
  readonly pdf: Blob;
  readonly overflowing: readonly Overflowing[];
  readonly typography: Typography;
};

/**
 * Un texte strict qui déborde : son entrée du DTO, le nom de sa
 * rubrique, le texte, et le maximum de son compteur.
 */
export type Overflowing = {
  readonly entry: string;
  readonly label: string;
  readonly text: string;
  readonly maximum: number;
};

export class GenerateTheCerfa {
  /** La marque de chaque page d'un aperçu. */
  static readonly PREVIEW_MARK = "Aperçu – texte à valider";

  readonly #pdf: CerfaPdf;

  constructor(pdf: CerfaPdf) {
    this.#pdf = pdf;
  }

  /**
   * Génère le cerfa rempli d'après `dto`, aplati, prêt à télécharger. Il n'est
   * qu'un aperçu, marqué sur chaque page, si un texte strict en déborde, ou si
   * `preview` le demande : un texte s'y réécrit encore.
   */
  async execute<Dto extends CerfaDto>(
    cerfa: Cerfa<Dto>,
    dto: Dto,
    { preview = false }: { preview?: boolean } = {},
  ): Promise<GeneratedCerfa> {
    const [template, lines] = await Promise.all([
      cerfa.template(),
      this.#pdf.lineMeasurers(StrictEntriesService.of(cerfa)),
    ]);
    const { entries, marks, overflowingOf, ...options } = instructionsOf(
      cerfa,
      dto,
    );
    const filled = await this.#pdf.fill(template, entries, options);
    const { drawings, ...drawn } = drawingsOf(cerfa, dto, lines);
    const overflowing = [
      ...filled.overflowing.map(overflowingOf),
      ...drawn.overflowing,
    ];
    const marked = preview || overflowing.length > 0;
    const flattened = await this.#flatten(filled, { marks, drawings }, marked);
    return generatedOf({
      cerfa,
      entries,
      filled,
      drawings,
      overflowing,
      flattened,
    });
  }

  // Le PDF rempli, sans champ, avec ses marques et ses dessins. Un texte strict
  // qui déborde, ou l'aperçu demandé : il porte la marque de l'aperçu.
  #flatten(
    filled: Filled,
    { marks, drawings }: { marks: Mark[]; drawings: DrawnTexts },
    marked: boolean,
  ): Promise<Flattened> {
    return this.#pdf.flatten(filled.pdf, {
      marks,
      drawings: [
        ...drawings.map(([, drawing]) => drawing),
        ...filled.overflows,
      ],
      ...(marked ? { watermark: GenerateTheCerfa.PREVIEW_MARK } : {}),
    });
  }
}

/** Les textes dessinés, un par position, avec la clé de leur entrée. */
type DrawnTexts = readonly (readonly [string, Drawing])[];

// ---- implémentation ----

// Le PDF aplati, ce qui en déborde, et la taille de ses textes imprimés.
function generatedOf<Dto extends CerfaDto>({
  cerfa,
  entries,
  filled,
  drawings,
  overflowing,
  flattened: { pdf, drawnSizes },
}: {
  cerfa: Cerfa<Dto>;
  entries: readonly FieldEntry[];
  filled: Filled;
  drawings: DrawnTexts;
  overflowing: readonly Overflowing[];
  flattened: Flattened;
}): GeneratedCerfa {
  return {
    // `pdf` est une vue typée trop large pour `BlobPart` : on la repasse telle
    // quelle.
    pdf: new Blob([pdf as BlobPart], { type: "application/pdf" }),
    overflowing,
    typography: TypographyService.of({
      texts: textsOf(cerfa, entries),
      fieldSizes: filled.sizes,
      drawn: drawings.map(([key], index) => [key, drawnSizes[index]]),
      ids: cerfa.typographicIds,
    }),
  };
}

type Binding = TextBinding | StrictTextBinding | BoxBinding;

/**
 * Traduit ce que le DTO demande au PDF dans les noms du gabarit. Une entrée
 * absente, vide ou fausse laisse sa place vide.
 */
function instructionsOf<Dto extends CerfaDto>(cerfa: Cerfa<Dto>, dto: Dto) {
  const bound = Object.entries(
    cerfa.fields as Readonly<Record<string, Binding>>,
  );
  const givenValue = (key: string) => {
    const value = dto.fields[key];
    return isGiven(value) ? value : undefined;
  };
  return {
    entries: bound.flatMap(([key, binding]) =>
      entryOf(binding, givenValue(key)),
    ),
    singleLineFields: bound.flatMap(([, binding]) =>
      "singleLine" in binding && binding.singleLine ? [binding.field] : [],
    ),
    dateFields: bound.flatMap(([, binding]) =>
      "date" in binding && binding.date ? [binding.field] : [],
    ),
    marks: bound.flatMap(([key, binding]): Mark[] =>
      "drawn" in binding && binding.drawn && givenValue(key) ? [binding] : [],
    ),
    overflowingOf: overflowingOf(bound, dto),
  };
}

// Les textes à dessiner, un par position, avec la clé de leur entrée : un
// texte se répète sur chaque volet qui le porte. Un texte strict s'y dessine
// à sa taille, ou son plus long début qui tient : il déborde.
function drawingsOf<Dto extends CerfaDto>(
  cerfa: Cerfa<Dto>,
  dto: Dto,
  lines: ReadonlyMap<string, StrictLineMeasure>,
) {
  const overflowing: Overflowing[] = [];
  const drawings = Object.entries(cerfa.drawings).flatMap(([key, binding]) => {
    const text = dto.drawings[key];
    if (!isGiven(text)) return [];
    const line = lines.get(key);
    if (!binding.strict || !line) return drawn(key, binding, text);
    const { written, fits, maximum } = line.fitting(text);
    const { label } = binding.strict;
    if (!fits) overflowing.push({ entry: key, label, text, maximum });
    const { size } = StrictEntriesService.layoutOf(binding.strict);
    return drawn(key, { ...binding, singleLine: true }, written, size);
  });
  return { drawings, overflowing };
}

// Un texte dessiné à chacune de ses positions.
function drawn(
  key: string,
  { positions, singleLine }: DrawingBinding,
  text: string,
  size: number = TEXT_SIZES.target,
): (readonly [string, Drawing])[] {
  return positions.map((at) => [key, { text, at, size, singleLine }]);
}

// Chaque texte écrit dans un champ : la clé de son entrée, et le nom du champ.
function textsOf<Dto extends CerfaDto>(
  cerfa: Cerfa<Dto>,
  entries: readonly FieldEntry[],
) {
  const written = new Set(
    entries.flatMap((entry) => ("text" in entry ? [entry.field] : [])),
  );
  return Object.entries(
    cerfa.fields as Readonly<Record<string, Binding>>,
  ).flatMap(([key, binding]) =>
    "field" in binding && !("state" in binding) && written.has(binding.field)
      ? [[key, binding.field] as const]
      : [],
  );
}

// Retrouve, d'un champ strict qui déborde, l'entrée du DTO qui l'écrit.
function overflowingOf(
  bound: readonly (readonly [string, Binding])[],
  dto: CerfaDto,
): (overflow: StrictOverflow) => Overflowing {
  return ({ field, maximum }) => {
    const found = bound.find(
      ([, binding]) => "strict" in binding && binding.field === field,
    );
    if (!found || !("strict" in found[1]))
      throw new Error(`« ${field} » n'est pas un texte strict du cerfa.`);
    const [entry, { strict }] = found;
    return {
      entry,
      label: strict.label,
      text: StrictEntriesService.textOf(dto, entry),
      maximum,
    };
  };
}

function isGiven<Reading>(value: Reading | undefined): value is Reading {
  return value !== undefined && value !== "" && value !== false;
}

// Traduit une entrée du DTO en valeur à écrire dans un champ. Une case
// dessinée n'en donne aucune : elle part dans les marques.
function entryOf(
  binding: Binding,
  value: string | boolean | undefined,
): FieldEntry[] {
  if ("state" in binding)
    return value && !binding.drawn
      ? [{ field: binding.field, checked: binding.state }]
      : [];
  if (value === undefined) return [];
  const strict =
    "strict" in binding
      ? { strict: StrictEntriesService.layoutOf(binding.strict) }
      : {};
  return [{ field: binding.field, text: String(value), ...strict }];
}
