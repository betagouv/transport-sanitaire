// Le passage des données du simulateur au DTO d'un cerfa.
//
// Le module cerfa ne connaît que son DTO. Le modèle dit comment le calculer :
// une valeur par entrée, lue sur les questions validées, les faits et les
// cibles figés au verrou, au jour de la complétion (`given.today()`).

import {
  NOTHING,
  type Read,
  readsOf,
  Value,
} from "../../core/socle/questionnaire-engine/condition";
import type { Cerfa, CerfaDto } from "./cerfa/cerfa";

/** Une valeur par entrée du DTO. */
export type CerfaMapping<Dto extends CerfaDto> = {
  readonly fields: {
    readonly [Key in keyof Dto["fields"]]-?: Value<Dto["fields"][Key]>;
  };
  readonly drawings: {
    readonly [Key in keyof Dto["drawings"]]-?: Value<Dto["drawings"][Key]>;
  };
};

/** Un cerfa et le mapping qui calcule son DTO, vérifiés ensemble. */
export type BoundCerfa = {
  readonly cerfa: Cerfa<CerfaDto>;
  readonly mapping: CerfaMapping<CerfaDto>;
};

/**
 * Lie un cerfa au mapping de son DTO. Le compilateur vérifie qu'ils parlent du
 * même DTO : une entrée oubliée ou en trop ne compile pas.
 */
export function bindCerfa<Dto extends CerfaDto>(
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
export function cerfaValue(bound: BoundCerfa): Value<BoundCerfa> {
  const { fields, drawings } = bound.mapping;
  const reads = [...Object.values(fields), ...Object.values(drawings)]
    .map((value) => value.reads)
    .reduce(readsOf, NOTHING);
  return new Value(reads, () => bound);
}

/** Le DTO que `mapping` donne, chaque valeur lue par `read`. */
export function dtoFrom(mapping: CerfaMapping<CerfaDto>, read: Read): CerfaDto {
  const apply = (values: Readonly<Record<string, Value<unknown>>>) =>
    Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, read(value)]),
    );
  return {
    fields: apply(mapping.fields) as CerfaDto["fields"],
    drawings: apply(mapping.drawings) as CerfaDto["drawings"],
  };
}
