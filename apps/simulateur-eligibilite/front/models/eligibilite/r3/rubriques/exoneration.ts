// La case Oui / Non des cas particuliers d'exonération du ticket modérateur
// (Q3.7). Un cas coché donne Oui, « Aucun autre cas » donne Non. Sans Q3.7,
// posée seulement pour une hospitalisation, les deux restent vides (D-136).

import { given } from "../../../../../core/models/eligibilite/question";
import type { Rubrique } from "./rubrique";

export type Exoneration = {
  readonly exoneration_oui: boolean;
  readonly exoneration_non: boolean;
};

const cas = given.question("Q3.7").answer();

export const EXONERATION: Rubrique<Exoneration> = {
  exoneration_oui: cas.compute(
    (coches) => coches.hasAnyChecked() && !coches.checked("7_AUCUN"),
  ),
  exoneration_non: cas.checked("7_AUCUN"),
};
