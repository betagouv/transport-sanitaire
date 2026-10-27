// fait_critere_fauteuil : fauteuil sans transfert.
//
// Le critère 6 de Q1.2 est coché, ou non. Sans professionnel, Q1.2 ne se
// pose pas : il vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { AIDE, CRITERES } from "./communs.ts";

export const critereFauteuil = unFait("fait_critere_fauteuil")
  .ouiSi(CRITERES.checked("6_FAUTEUIL_SANS_TRANSFERT"))
  .nonSi(CRITERES.isPresent())
  .nonSi(
    AIDE.isOneOf("1_SEUL", "2_AVEC_UN_PROCHE"),
    "Q1.2 ne se pose pas : aucun professionnel n'intervient.",
  )
  .sinon("Q1.2 n'est pas encore validée.");
