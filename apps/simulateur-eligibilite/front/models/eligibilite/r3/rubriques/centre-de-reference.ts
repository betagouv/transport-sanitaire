// Le transport vers un autre centre de référence des maladies rares, sur le
// seul volet médical : la PMT page 3, la DAP page 2. La case suit la
// destination réelle (Q3.4.a) ; Non la laisse vide.

import { given } from "../../../../../core/models/eligibilite/question";
import type { Rubrique } from "./rubrique";

export type CentreDeReference = {
  readonly centre_rare: boolean;
};

export const CENTRE_DE_REFERENCE: Rubrique<CentreDeReference> = {
  centre_rare: given.cible("cible_centre_reference_destination_reelle").isOui(),
};
