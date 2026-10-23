// fait_p1_complete : réponses médicales validées.
//
// Aucune garde ne le lit : le constater pose les questions de P1. La décision
// l'impose, une fois P1 complète.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { Fait } from "../../../socle/index.ts";
import {
  type DeclarationDeFait,
  IMPOSEE_PAR_LA_DECISION,
} from "../declarations/faits.ts";

export const p1Complete: DeclarationDeFait = () =>
  Fait.inconnu(IMPOSEE_PAR_LA_DECISION);
