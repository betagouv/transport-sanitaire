// L'accident causé par un tiers (Q3.6.2) et sa date (Q3.6.3). Sans réponse,
// ni Oui ni Non ne se coche.

import { given } from "../../../../../core/models/eligibilite/question";
import type { Rubrique } from "./rubrique";

export type Accident = {
  readonly tiers_oui: boolean;
  readonly tiers_non: boolean;
  /** `AAAA-MM-JJ`. */
  readonly tiers_date?: string;
};

const tiers = given.question("Q3.6.2").answer();

export const ACCIDENT: Rubrique<Accident> = {
  tiers_oui: tiers.is("1_OUI"),
  tiers_non: tiers.is("2_NON"),
  tiers_date: given
    .question("Q3.6.3")
    .answer()
    .compute(({ value }) => value),
};
