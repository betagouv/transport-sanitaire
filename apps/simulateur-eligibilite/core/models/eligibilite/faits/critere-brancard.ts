// fait_critere_brancard : brancardage ou portage.
//
// Le critère 8 de Q1.2 est coché, ou non. Sans professionnel, Q1.2 ne se
// pose pas : il vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { AIDE, CRITERES } from "./communs.ts";

export const critereBrancard = unFait("fait_critere_brancard")
  .ouiSi(CRITERES.checked("8_BRANCARDAGE"))
  .nonSi(CRITERES.isPresent())
  .nonSi(
    AIDE.isOneOf("1_SEUL", "2_AVEC_UN_PROCHE"),
    "Q1.2 ne se pose pas : aucun professionnel n'intervient.",
  )
  .sinon("Q1.2 n'est pas encore validée.");
