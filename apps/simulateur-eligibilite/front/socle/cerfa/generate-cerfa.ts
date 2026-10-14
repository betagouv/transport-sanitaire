// Génère un cerfa rempli puis aplati, et le propose au téléchargement.
//
// Le cerfa ne sait pas d'où viennent ses données : il reçoit son DTO, que le
// simulateur calcule, et qu'une autre source pourrait calculer.
//
// `pdf-lib` et le gabarit ne se chargent qu'ici, quand le bouton s'affiche : le
// chunk d'entrée n'en porte rien, et `scripts/verifier-bundle.ts` le vérifie.

import type {
  BoxBinding,
  Cerfa,
  CerfaDto,
  CommentBinding,
  TextBinding,
} from "./cerfa";
import type { FieldEntry } from "./fill-cerfa";
import type { Drawing, Mark } from "./flatten-cerfa";
import { TEXT_SIZES } from "./text-sizes";

/** Le cerfa généré, et les commentaires qu'il n'a pas pu garder. */
export type GeneratedCerfa = {
  readonly pdf: Blob;
  /** Les entrées du DTO dont le commentaire a été retiré, faute de place. */
  readonly removedComments: readonly string[];
};

/** Le cerfa rempli d'après `dto`, aplati, prêt à télécharger. */
export async function generateCerfa<Dto extends CerfaDto>(
  cerfa: Cerfa<Dto>,
  dto: Dto,
): Promise<GeneratedCerfa> {
  const [template, { fillCerfa }, { flattenCerfa }] = await Promise.all([
    cerfa.template(),
    import("./fill-cerfa"),
    import("./flatten-cerfa"),
  ]);
  const { entries, singleLineFields, marks, drawings, commentOf } =
    instructionsOf(cerfa, dto);
  const filled = await fillCerfa(template, entries, { singleLineFields });
  const pdf = await flattenCerfa(filled.pdf, {
    marks,
    drawings: [...drawings, ...filled.overflows],
  });
  return {
    // `pdf` est une vue typée trop large pour `BlobPart` : on la repasse telle
    // quelle.
    pdf: new Blob([pdf as BlobPart], { type: "application/pdf" }),
    removedComments: filled.withoutComment.flatMap(commentOf),
  };
}

/**
 * Le chargeur d'un gabarit servi comme asset de l'app : un modèle l'importe par
 * `import url from "./gabarit.pdf?url"`.
 */
export function templateAt(url: string): () => Promise<ArrayBuffer> {
  return async () => {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Gabarit indisponible (HTTP ${response.status}).`);
    return response.arrayBuffer();
  };
}

/** Le nom du fichier : sa racine, puis la date du document. */
export function fileNameOf(root: string, date: Date): string {
  // La locale suédoise écrit la date en `AAAA-MM-JJ`, qui se trie.
  const day = date.toLocaleDateString("sv-SE", {
    timeZone: "Europe/Paris",
  });
  return `${root}-${day}.pdf`;
}

/** Déclenche le téléchargement de `blob` sous `name`, puis libère son URL. */
export function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ---- implémentation ----

type Binding = TextBinding | CommentBinding | BoxBinding;

/**
 * Ce que le DTO demande au PDF, dans les noms du gabarit. Une entrée absente,
 * vide ou fausse laisse sa place vide.
 */
function instructionsOf<Dto extends CerfaDto>(cerfa: Cerfa<Dto>, dto: Dto) {
  const bound = Object.entries(
    cerfa.fields as Readonly<Record<string, Binding>>,
  );
  const comments = commentsOf(bound);
  const givenValue = (key: string) => {
    const value = dto.fields[key];
    return isGiven(value) ? value : undefined;
  };
  return {
    entries: bound.flatMap(([key, binding]) =>
      entryOf(binding, givenValue(key), givenValue(comments.get(key) ?? "")),
    ),
    singleLineFields: bound.flatMap(([, binding]) =>
      "singleLine" in binding && binding.singleLine ? [binding.field] : [],
    ),
    marks: bound.flatMap(([key, binding]): Mark[] =>
      "drawn" in binding && binding.drawn && givenValue(key) ? [binding] : [],
    ),
    drawings: Object.entries(cerfa.drawings).flatMap(([key, at]): Drawing[] => {
      const text = dto.drawings[key];
      return isGiven(text) ? [{ text, at, size: TEXT_SIZES.target }] : [];
    }),
    commentOf: commentOf(bound, comments),
  };
}

// Du champ qui a perdu son commentaire à l'entrée du DTO qui le portait.
function commentOf(
  bound: readonly (readonly [string, Binding])[],
  comments: ReadonlyMap<string, string>,
): (field: string) => string[] {
  return (field) =>
    bound.flatMap(([key, binding]) => {
      const comment = comments.get(key);
      return "field" in binding && binding.field === field && comment
        ? [comment]
        : [];
    });
}

// De chaque texte commenté à l'entrée qui porte son commentaire. Un
// commentaire ne suit qu'un texte du cerfa.
function commentsOf(
  bound: readonly (readonly [string, Binding])[],
): Map<string, string> {
  const texts = new Set(
    bound.flatMap(([key, binding]) =>
      "field" in binding && !("state" in binding) ? [key] : [],
    ),
  );
  const comments = new Map<string, string>();
  for (const [key, binding] of bound) {
    if (!("commentOn" in binding)) continue;
    if (!texts.has(binding.commentOn))
      throw new Error(
        `« ${key} » commente « ${binding.commentOn} », qui n'est pas un texte du cerfa.`,
      );
    comments.set(binding.commentOn, key);
  }
  return comments;
}

function isGiven<Value>(value: Value | undefined): value is Value {
  return value !== undefined && value !== "" && value !== false;
}

// Une case dessinée n'est pas un champ à remplir : elle part dans les marques.
// Un commentaire s'écrit avec le texte qu'il suit.
function entryOf(
  binding: Binding,
  value: string | boolean | undefined,
  comment: string | boolean | undefined,
): FieldEntry[] {
  if ("commentOn" in binding) return [];
  if ("state" in binding)
    return value && !binding.drawn
      ? [{ field: binding.field, checked: binding.state }]
      : [];
  if (value === undefined && comment === undefined) return [];
  return [
    {
      field: binding.field,
      text: value === undefined ? "" : String(value),
      ...(comment === undefined ? {} : { comment: String(comment) }),
    },
  ];
}
