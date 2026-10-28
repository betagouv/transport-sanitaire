// fait_p1_complete : réponses médicales validées.
//
// Aucune garde ne le lit : le constater pose les questions de P1. La décision
// l'impose, une fois P1 complète : ce qu'il lit se déclare avec sa
// valeur, dans `preconisation.ts` (#259).
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { IMPOSEE_PAR_LA_DECISION } from "../declarations/faits.ts";

export const p1Complete = unFait("fait_p1_complete").sinon(
  IMPOSEE_PAR_LA_DECISION,
);
