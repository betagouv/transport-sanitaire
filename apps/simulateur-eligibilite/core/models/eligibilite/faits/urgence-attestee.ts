// fait_urgence_attestee : urgence attestée par le médecin prescripteur.
//
// Q2.3.4 le dit sur la page du trajet, ou Q2.12 quand la branche la reprend :
// « Oui » l'établit, « Non » vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given, URGENCE_EN_ATTENTE } from "./communs.ts";

const SUR_LE_TRAJET = given.question("Q2.3.4").answer();
const SUR_LA_BRANCHE = given.question("Q2.12").answer();

export const urgenceAttestee = unFait("fait_urgence_attestee")
  .ouiSi(SUR_LE_TRAJET.is("1_OUI"))
  .nonSi(SUR_LE_TRAJET.is("2_NON"))
  .ouiSi(SUR_LE_TRAJET.isValidated().not().and(SUR_LA_BRANCHE.is("1_OUI")))
  .nonSi(SUR_LE_TRAJET.isValidated().not().and(SUR_LA_BRANCHE.is("2_NON")))
  .sinon(URGENCE_EN_ATTENTE);
