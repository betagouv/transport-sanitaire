// Le passage des données du simulateur au DTO d'un cerfa.
//
// Le module cerfa ne connaît que son DTO. Le modèle dit comment le calculer :
// une fonction par entrée, qui lit tout ce que le simulateur sait (réponses,
// faits, cibles, date de complétion).

import type { Cerfa, CerfaDto } from "./cerfa/cerfa";

/** Une fonction par entrée du DTO, des données `Data` à sa valeur. */
export type CerfaMapping<Dto extends CerfaDto, Data> = {
  readonly fields: {
    readonly [Key in keyof Dto["fields"]]-?: (data: Data) => Dto["fields"][Key];
  };
};

/** Un cerfa et le mapping qui calcule son DTO, vérifiés ensemble. */
export type BoundCerfa<Data> = {
  readonly cerfa: Cerfa<CerfaDto>;
  readonly mapping: CerfaMapping<CerfaDto, Data>;
};

/**
 * Lie un cerfa au mapping de son DTO. Le compilateur vérifie qu'ils parlent du
 * même DTO : une entrée oubliée ou en trop ne compile pas.
 */
export function bindCerfa<Dto extends CerfaDto, Data>(
  cerfa: Cerfa<Dto>,
  mapping: CerfaMapping<Dto, Data>,
): BoundCerfa<Data> {
  // Le socle ne lit aucune entrée : il rend le DTO au cerfa qui l'a déclaré.
  return { cerfa, mapping } as unknown as BoundCerfa<Data>;
}

/** Le DTO que `mapping` calcule de `data`. */
export function dtoFrom<Data>(
  mapping: CerfaMapping<CerfaDto, Data>,
  data: Data,
): CerfaDto {
  const apply = (rules: Readonly<Record<string, (data: Data) => unknown>>) =>
    Object.fromEntries(
      Object.entries(rules).map(([key, rule]) => [key, rule(data)]),
    );
  return { fields: apply(mapping.fields) as CerfaDto["fields"] };
}
