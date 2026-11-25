// Les textes stricts d'un cerfa : ceux de ses champs, et ceux qu'il
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
  StrictEntry,
  StrictLayout,
  StrictTextBinding,
  TextBinding,
} from "./cerfa.types";
import { TEXT_SIZES } from "./text-sizes.constants";

type Binding = TextBinding | StrictTextBinding | BoxBinding;

export class StrictEntriesService {
  /** Les textes stricts du cerfa : ceux de ses champs, puis ses dessins. */
  static of(cerfa: Cerfa<CerfaDto>): StrictEntry[] {
    const fields = Object.entries(cerfa.fields as Record<string, Binding>);
    const drawings = Object.entries(cerfa.drawings);
    return [
      ...fields.flatMap(([entry, binding]) =>
        "strict" in binding
          ? [{ entry, strict: binding.strict, place: { field: binding.field } }]
          : [],
      ),
      ...drawings.flatMap(([entry, { strict, positions }]) =>
        strict
          ? [
              {
                entry,
                strict,
                place: { width: StrictEntriesService.#narrowest(positions) },
              },
            ]
          : [],
      ),
    ];
  }

  /** Comment s'écrit un texte de cette règle : sa taille, et s'il tient sur une ligne. */
  static layoutOf(strict: Strict): StrictLayout {
    return {
      size: strict.size ?? TEXT_SIZES.target,
      oneLine: strict.oneLine ?? false,
    };
  }

  /** Le texte de cette entrée dans le DTO, champ ou dessin. */
  static textOf(dto: CerfaDto, entry: string): string {
    return String(dto.fields[entry] ?? dto.drawings[entry] ?? "");
  }

  // Un texte dessiné sur chaque volet tient sur le plus étroit.
  static #narrowest(positions: readonly { readonly width: number }[]): number {
    return Math.min(...positions.map(({ width }) => width));
  }
}
