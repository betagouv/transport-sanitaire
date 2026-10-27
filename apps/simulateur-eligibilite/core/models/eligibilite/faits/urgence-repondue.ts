// fait_urgence_repondue : question d'urgence DAP répondue.
//
// Q2.3.4, ou Q2.12 quand la branche la reprend, a sa réponse : « Oui » comme
// « Non » l'établissent.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given, URGENCE_EN_ATTENTE } from "./communs.ts";

const SUR_LE_TRAJET = given.question("Q2.3.4").answer();
const SUR_LA_BRANCHE = given.question("Q2.12").answer();

export const urgenceRepondue = unFait("fait_urgence_repondue")
  .ouiSi(SUR_LE_TRAJET.isOneOf("1_OUI", "2_NON"))
  .ouiSi(
    SUR_LE_TRAJET.isValidated()
      .not()
      .and(SUR_LA_BRANCHE.isOneOf("1_OUI", "2_NON")),
  )
  .sinon(URGENCE_EN_ATTENTE);
