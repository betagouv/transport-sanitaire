// fait_critere_surveillance : surveillance qualifiée constante.
//
// Le critère 9 de Q1.2 est coché, ou non. Sans professionnel, Q1.2 ne se
// pose pas : il vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";

export const critereSurveillance = unFait("fait_critere_surveillance")
  .ouiSi(given.question("Q1.2").answer().checked("9_SURVEILLANCE"))
  .nonSi(given.question("Q1.2").answer().isPresent())
  .nonSi(
    given.question("Q1.1").answer().isOneOf("1_SEUL", "2_AVEC_UN_PROCHE"),
    "Q1.2 ne se pose pas : aucun professionnel n'intervient.",
  )
  .sinon("Q1.2 n'est pas encore validée.");
