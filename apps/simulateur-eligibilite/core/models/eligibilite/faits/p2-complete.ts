// fait_p2_complete : réponses administratives validées.
//
// Aucune garde ne le lit : le constater pose les questions de P2. La décision
// l'impose, une fois P2 complète.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { Fait } from "../../../socle/index.ts";
import {
  type DeclarationDeFait,
  IMPOSEE_PAR_LA_DECISION,
} from "../declarations/faits.ts";

export const p2Complete: DeclarationDeFait = () =>
  Fait.inconnu(IMPOSEE_PAR_LA_DECISION);
