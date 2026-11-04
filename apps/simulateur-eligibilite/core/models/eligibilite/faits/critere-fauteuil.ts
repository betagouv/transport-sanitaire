// fait_critere_fauteuil : fauteuil sans transfert.
//
// Le critère 6 de Q1.2 est coché, ou non. Sans professionnel, Q1.2 ne se
// pose pas : il vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";

export const critereFauteuil = unFait("fait_critere_fauteuil")
  .ouiSi(given.question("Q1.2").answer().checked("6_FAUTEUIL_SANS_TRANSFERT"))
  .nonSi(given.question("Q1.2").answer().isPresent())
  .nonSi(
    given.question("Q1.1").answer().isOneOf("1_SEUL", "2_AVEC_UN_PROCHE"),
    "Q1.2 ne se pose pas : aucun professionnel n'intervient.",
  )
  .sinon("Q1.2 n'est pas encore validée.");
