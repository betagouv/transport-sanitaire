// L'accident causé par un tiers et sa date, recueillis en Q1.3
// (DOC-Q13-TIERS-20261104). Non : la case s'est proposée sur la page validée,
// et reste décochée. Sans Q1.3 validée, ni Oui ni Non ne se coche.

import { given } from "../../../../../core/models/eligibilite/questions/reponses";
import type { Rubrique } from "./rubrique";

export type Accident = {
  readonly tiers_oui: boolean;
  readonly tiers_non: boolean;
  /** `AAAA-MM-JJ`. */
  readonly tiers_date?: string;
};

const casParticuliers = given.question("Q1.3").answer();
const tiersCoche = casParticuliers.checked("9_ACCIDENT_TIERS");

export const ACCIDENT: Rubrique<Accident> = {
  tiers_oui: tiersCoche,
  tiers_non: casParticuliers.offered("9_ACCIDENT_TIERS").and(tiersCoche.not()),
  tiers_date: given
    .question("Q1.3.accident_tiers_date")
    .answer()
    .compute(({ value }) => value),
};
