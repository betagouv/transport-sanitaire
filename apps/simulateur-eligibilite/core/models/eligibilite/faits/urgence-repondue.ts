// fait_urgence_repondue : question d'urgence DAP répondue.
//
// Q2.3.4 a sa réponse, sur la page du trajet ou sur celle de la branche :
// « Oui » comme « Non » l'établissent.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given, URGENCE_EN_ATTENTE } from "./communs.ts";

export const urgenceRepondue = unFait("fait_urgence_repondue")
  .ouiSi(given.question("Q2.3.4").answer().isOneOf("1_OUI", "2_NON"))
  .sinon(URGENCE_EN_ATTENTE);
