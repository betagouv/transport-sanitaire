// Le transport vers un autre centre de référence des maladies rares, sur le
// seul volet médical : la PMT page 3, la DAP page 2. La case suit la
// destination réelle (Q3.4.a) ; Non la laisse vide. Elle lit la question
// telle quelle : Q3.4.a vient après le verrou, et les cibles y sont figées.

import { given } from "../../../../../core/models/eligibilite/question";
import type { Rubrique } from "./rubrique";

export type CentreDeReference = {
  readonly centre_rare: boolean;
};

export const CENTRE_DE_REFERENCE: Rubrique<CentreDeReference> = {
  centre_rare: given.question("Q3.4.a").answer().is("1_OUI"),
};
