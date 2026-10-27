// fait_prefere_transport_commun : préférence transports en commun si mode
// non professionnel.
//
// Q1.4 le dit, et ne se pose qu'au patient qui se passe d'un professionnel.
// Sinon, la préférence est sans objet : elle vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { AIDE, given } from "./communs.ts";

const MODE = given.question("Q1.4").answer();

export const prefereTransportCommun = unFait("fait_prefere_transport_commun")
  .nonSi(MODE.is("1_VEHICULE_PERSONNEL"))
  .ouiSi(MODE.is("2_TRANSPORTS_EN_COMMUN"))
  .nonSi(
    AIDE.is("3_AVEC_UN_PROFESSIONNEL"),
    "Q1.4 ne se pose pas : un professionnel intervient.",
  )
  .sinon("Q1.4 n'est pas encore validée.");
