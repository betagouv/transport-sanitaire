// fait_urgence_attestee : urgence attestée par le médecin prescripteur.
//
// Q2.3.4 le dit, sur la page du trajet ou sur celle de la branche : « Oui »
// l'établit, « Non » vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given, URGENCE_EN_ATTENTE } from "./communs.ts";

const URGENCE = given.question("Q2.3.4").answer();

export const urgenceAttestee = unFait("fait_urgence_attestee")
  .ouiSi(URGENCE.is("1_OUI"))
  .nonSi(URGENCE.is("2_NON"))
  .sinon(URGENCE_EN_ATTENTE);
