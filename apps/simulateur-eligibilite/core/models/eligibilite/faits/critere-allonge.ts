// fait_critere_allonge : position allongée ou demi-assise.
//
// Le critère 7 de Q1.2 est coché, ou non. Sans professionnel, Q1.2 ne se
// pose pas : il vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { AIDE, CRITERES } from "./communs.ts";

export const critereAllonge = unFait("fait_critere_allonge")
  .ouiSi(CRITERES.checked("7_ALLONGE"))
  .nonSi(CRITERES.isPresent())
  .nonSi(
    AIDE.isOneOf("1_SEUL", "2_AVEC_UN_PROCHE"),
    "Q1.2 ne se pose pas : aucun professionnel n'intervient.",
  )
  .sinon("Q1.2 n'est pas encore validée.");
