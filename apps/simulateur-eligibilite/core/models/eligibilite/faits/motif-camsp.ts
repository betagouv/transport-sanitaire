// fait_motif_camsp : soin CAMSP ou CMPP qualifié.
//
// L'autre cadre de Q2.2.1 le dit, coché ou écarté (Q2.2.1.b). Sinon, Q2.1 dit
// le CAMSP, et Q2.1.h dit si la séance est dans le parcours de l'enfant.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import {
  AUTRE_CADRE_ECARTE,
  given,
  MOTIF,
  SITUATION_DU_CADRE,
  SITUATION_PROPOSEE,
} from "./communs.ts";

const SUIVI = given.question("Q2.1.h").answer();

export const motifCamsp = unFait("fait_motif_camsp")
  .nonSi(
    AUTRE_CADRE_ECARTE.and(SITUATION_PROPOSEE["6_CAMSP"]),
    "« autre situation » proposée, non cochée.",
  )
  .ouiSi(SITUATION_DU_CADRE.checked("6_CAMSP"))
  .nonSiEcartee(SITUATION_DU_CADRE, "6_CAMSP")
  .ouiSi(MOTIF.is("10_CAMSP").and(SUIVI.is("1_OUI")))
  .nonSi(MOTIF.is("10_CAMSP").and(SUIVI.is("2_NON")))
  .inconnuSi(MOTIF.is("10_CAMSP").and(SUIVI.is("3_NE_SAIT_PAS")))
  .sinon("Ni Q2.1.h, ni Q2.2.1 n'établissent encore le CAMSP.");
