// fait_critere_oxygene : oxygène pendant le transport.
//
// Le critère 10 de Q1.2 est coché, ou non. Sans professionnel, Q1.2 ne se
// pose pas : il vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { AIDE, CRITERES } from "./communs.ts";

export const critereOxygene = unFait("fait_critere_oxygene")
  .ouiSi(CRITERES.checked("10_OXYGENE"))
  .nonSi(CRITERES.isPresent())
  .nonSi(
    AIDE.isOneOf("1_SEUL", "2_AVEC_UN_PROCHE"),
    "Q1.2 ne se pose pas : aucun professionnel n'intervient.",
  )
  .sinon("Q1.2 n'est pas encore validée.");
