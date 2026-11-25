// Les données d'un cerfa, sans son gabarit : le DTO que le métier remplit, et
// le mapping qui dit comment chaque entrée se lit.
//
// Le DTO parle en mots clairs (`longue_distance`). Où chaque entrée va dans le
// PDF est l'affaire de l'écran (`front/socle/cerfa/`) : le métier ne connaît
// que les noms des entrées, et l'écran doit dire où écrire chacune.

import type { Reading } from "../questionnaire-engine/index.ts";

/**
 * Les données d'un cerfa. `fields` va dans les champs du gabarit : un texte,
 * ou une case cochée (`true`). `drawings` se dessine là où le gabarit n'a pas
 * de champ. Une entrée absente laisse sa place vide.
 */
export type CerfaDto = {
  readonly fields: Readonly<Record<string, string | boolean | undefined>>;
  readonly drawings: Readonly<Record<string, string | undefined>>;
};

/** Une valeur par entrée du DTO. */
export type CerfaMapping<Dto extends CerfaDto> = {
  readonly fields: {
    readonly [Key in keyof Dto["fields"]]-?: Reading<Dto["fields"][Key]>;
  };
  readonly drawings: {
    readonly [Key in keyof Dto["drawings"]]-?: Reading<Dto["drawings"][Key]>;
  };
};
