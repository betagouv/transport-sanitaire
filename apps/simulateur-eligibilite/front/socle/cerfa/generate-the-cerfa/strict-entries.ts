// Les textes stricts d'un cerfa (D-302) : ceux de ses champs, et ceux qu'il
// dessine là où le gabarit n'a pas de champ. Chacun se mesure comme il
// s'écrit : la génération, l'éditeur de R3 et le compteur d'une question
// partagent cette mesure.
//
// Ce fichier ne charge rien : `pdf-lib` vient avec `measure-strict-texts.ts`.

import type {
  BoxBinding,
  Cerfa,
  CerfaDto,
  Strict,
  StrictTextBinding,
  TextBinding,
} from "../cerfa";
import type { StrictLayout } from "./strict-text";
import { TEXT_SIZES } from "./text-sizes";

/**
 * Un texte strict du cerfa : son entrée du DTO, sa règle, et sa place, un
 * champ du gabarit ou la plus étroite de ses positions dessinées.
 */
export type StrictEntry = {
  readonly entry: string;
  readonly strict: Strict;
  readonly place: StrictPlace;
};

type StrictPlace = { readonly field: string } | { readonly width: number };

/** Les textes stricts du cerfa : ceux de ses champs, puis ses dessins. */
export function strictEntriesOf(cerfa: Cerfa<CerfaDto>): StrictEntry[] {
  const fields = Object.entries(cerfa.fields as Record<string, Binding>);
  const drawings = Object.entries(cerfa.drawings);
  return [
    ...fields.flatMap(([entry, binding]) =>
      "strict" in binding
        ? [{ entry, strict: binding.strict, place: { field: binding.field } }]
        : [],
    ),
    ...drawings.flatMap(([entry, { strict, positions }]) =>
      strict ? [{ entry, strict, place: { width: narrowest(positions) } }] : [],
    ),
  ];
}

/** Comment s'écrit un texte de cette règle : sa taille, et s'il tient sur une ligne. */
export function layoutOf(strict: Strict): StrictLayout {
  return {
    size: strict.size ?? TEXT_SIZES.target,
    oneLine: strict.oneLine ?? false,
  };
}

/** Le texte de cette entrée dans le DTO, champ ou dessin. */
export function textOf(dto: CerfaDto, entry: string): string {
  return String(dto.fields[entry] ?? dto.drawings[entry] ?? "");
}

// ---- implémentation ----

type Binding = TextBinding | StrictTextBinding | BoxBinding;

// Un texte dessiné sur chaque volet tient sur le plus étroit.
function narrowest(positions: readonly { readonly width: number }[]): number {
  return Math.min(...positions.map(({ width }) => width));
}
