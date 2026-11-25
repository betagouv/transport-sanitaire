// Le calcul du DTO d'un cerfa d'après ce que le simulateur lit.
//
// Le module cerfa ne connaît que son DTO. Le modèle dit comment le calculer :
// une valeur par entrée, lue sur les questions validées, les faits et les
// cibles figés au verrou, au jour de la complétion (`given.today()`).

import {
  type Context,
  Reading,
  Reads,
} from "../../../core/socle/questionnaire-engine";
import type { BoundCerfa, Cerfa, CerfaDto, CerfaMapping } from "./cerfa.types";

export class CerfaDtoService {
  /**
   * Lie un cerfa au mapping de son DTO. Le compilateur vérifie qu'ils parlent
   * du même DTO : une entrée oubliée ou en trop ne compile pas.
   */
  static link<Dto extends CerfaDto>(
    cerfa: Cerfa<Dto>,
    mapping: CerfaMapping<Dto>,
  ): BoundCerfa {
    // Le socle ne lit aucune entrée : il rend le DTO au cerfa qui l'a déclaré.
    return { cerfa, mapping } as unknown as BoundCerfa;
  }

  /**
   * Ce cerfa, en valeur qui lit ce que lisent ses entrées. Le choix du document
   * la donne : ce que lit un cerfa compte quand la préconisation le choisit.
   */
  static readingOf(bound: BoundCerfa): Reading<BoundCerfa> {
    const { fields, drawings } = bound.mapping;
    const values = [...Object.values(fields), ...Object.values(drawings)];
    const reads = Reads.union(...values.map((value) => value.reads));
    return new Reading(reads, () => bound);
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
