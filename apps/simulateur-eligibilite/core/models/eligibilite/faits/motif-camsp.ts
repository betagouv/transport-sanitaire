// fait_motif_camsp : soin CAMSP ou CMPP qualifié.
//
// Le second bloc de Q2.2.1 le dit, coché ou écarté (Q2.2.1.b). Sinon, Q2.1 dit
// le CAMSP, et Q2.1.h dit si la séance est dans le parcours de l'enfant.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given, MOTIF, SOINS } from "./communs.ts";

const SUIVI = given.question("Q2.1.h").answer();

export const motifCamsp = unFait("fait_motif_camsp")
  .ouiSi(SOINS.checked("6_CAMSP"))
  .nonSiEcartee(SOINS, "6_CAMSP")
  .ouiSi(MOTIF.is("10_CAMSP").and(SUIVI.is("1_OUI")))
  .nonSi(MOTIF.is("10_CAMSP").and(SUIVI.is("2_NON")))
  .sinon("Ni Q2.1.h, ni Q2.2.1 n'établissent encore le CAMSP.");
