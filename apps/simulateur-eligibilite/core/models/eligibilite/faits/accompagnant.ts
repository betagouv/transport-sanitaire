// fait_accompagnant : présence nécessaire d'un proche accompagnant.
//
// Q1.1 le dit : un proche accompagne le patient, ou il se déplace seul, ou
// un professionnel intervient.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { AIDE } from "./communs.ts";

export const accompagnant = unFait("fait_accompagnant")
  .ouiSi(AIDE.is("2_AVEC_UN_PROCHE"))
  .nonSi(AIDE.isOneOf("1_SEUL", "3_AVEC_UN_PROFESSIONNEL"))
  .sinon("Q1.1 n'est pas encore validée.");
