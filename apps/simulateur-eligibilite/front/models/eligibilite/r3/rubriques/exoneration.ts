// La case Oui / Non des cas particuliers d'exonération du ticket modérateur
// (Q3.7). Un cas coché donne Oui, « Aucun autre cas » donne Non. Sans Q3.7,
// posée seulement pour une hospitalisation, les deux restent vides (D-136).

import type { Rubrique } from "./rubrique";

export type Exoneration = {
  readonly exoneration_oui: boolean;
  readonly exoneration_non: boolean;
};

export const EXONERATION: Rubrique<Exoneration> = {
  exoneration_oui: ({ validated }) => {
    const cas = validated.question("Q3.7");
    return cas.hasAnyChecked() && !cas.checked("7_AUCUN");
  },
  exoneration_non: ({ validated }) =>
    validated.question("Q3.7").checked("7_AUCUN"),
};
