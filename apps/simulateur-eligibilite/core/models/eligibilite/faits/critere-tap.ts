// fait_critere_tap : autre critère de transport assis professionnel.
//
// L'un des critères 1 à 5 de Q1.2 est coché, ou aucun. Sans professionnel,
// Q1.2 ne se pose pas : il vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { AIDE, CRITERES } from "./communs.ts";

export const critereTap = unFait("fait_critere_tap")
  .ouiSi(
    CRITERES.checked("1_PAS_AUTONOME")
      .or(CRITERES.checked("2_AIDE_TECHNIQUE"))
      .or(CRITERES.checked("3_TRANSMISSION_PAR_UN_PROFESSIONNEL"))
      .or(CRITERES.checked("4_HYGIENE"))
      .or(CRITERES.checked("5_RISQUE_DE_MALAISE")),
  )
  .nonSi(CRITERES.isPresent())
  .nonSi(
    AIDE.isOneOf("1_SEUL", "2_AVEC_UN_PROCHE"),
    "Q1.2 ne se pose pas : aucun professionnel n'intervient.",
  )
  .sinon("Q1.2 n'est pas encore validée.");
