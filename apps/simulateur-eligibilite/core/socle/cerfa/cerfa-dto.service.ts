// Le calcul du DTO d'un cerfa d'après ce que le simulateur lit.
//
// Le métier ne connaît que son DTO. Le mapping dit comment le calculer : une
// valeur par entrée, lue sur les questions validées, les faits et les cibles
// figés au verrou, au jour de la complétion (`given.today()`).

import { type Context, Reading, Reads } from "../questionnaire-engine/index.ts";
import type { CerfaDto, CerfaMapping } from "./cerfa.types.ts";

export class CerfaDtoService {
  /**
   * Cette valeur, en lecture qui lit ce que lisent les entrées de `mapping`.
   * Le choix du document la donne : ce que lit un cerfa compte quand la
   * préconisation le choisit.
   */
  static readingOf<Value>(
    mapping: CerfaMapping<CerfaDto>,
    value: Value,
  ): Reading<Value> {
    const { fields, drawings } = mapping;
    const values = [...Object.values(fields), ...Object.values(drawings)];
    const reads = Reads.union(...values.map((entry) => entry.reads));
    return new Reading(reads, () => value);
  }

  /** Le DTO que `mapping` donne, chaque entrée lue dans `context`. */
  static from(mapping: CerfaMapping<CerfaDto>, context: Context): CerfaDto {
    const apply = (values: Readonly<Record<string, Reading<unknown>>>) =>
      Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, value.in(context)]),
      );
    return {
      fields: apply(mapping.fields) as CerfaDto["fields"],
      drawings: apply(mapping.drawings) as CerfaDto["drawings"],
    };
  }
}
