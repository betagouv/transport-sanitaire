// L'Engagement maternité d'une DAP, et l'hébergement du dispositif que dit
// Q2.14 (`CONTRAT_Q38_MATERNITE_DOCUMENT.json`, D-251). Q3.8 et les lieux du
// trajet les lisent.

import { Q2_14_MOTIF } from "../../p2/questions/q2-14.ts";
import { given } from "../../question.ts";
import { uneDap } from "./supports-du-complement.ts";

/** La DAP coche le motif Engagement maternité. */
export const unEngagementMaternite = uneDap.and(
  given.cible("cible_dap_motif_engagement_maternite").isOui(),
);

/** Q2.14 dit un déplacement lié à l'hébergement du dispositif. */
export const unHebergementDuDispositif = unEngagementMaternite.and(
  given.question(Q2_14_MOTIF).answer().checked("2_HEBERGEMENT_ENGAGEMENT"),
);
