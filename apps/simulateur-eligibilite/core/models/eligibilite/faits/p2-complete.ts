// fait_p2_complete : réponses administratives validées.
//
// Aucune garde ne le lit : le constater pose les questions de P2. La décision
// l'impose, une fois P2 complète : ce qu'il lit se déclare avec sa
// valeur, dans `faits/preconisation.ts` (#259).
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { IMPOSEE_PAR_LA_DECISION } from "./noms.ts";

export const p2Complete = unFait("fait_p2_complete").sinon(
  IMPOSEE_PAR_LA_DECISION,
);
