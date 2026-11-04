// fait_motif_camsp : soin CAMSP ou CMPP qualifié.
//
// Le second bloc de Q2.2.1 le dit, coché ou écarté (Q2.2.1.b). Sinon, Q2.1 le
// dit : son libellé couvre la séance en ville organisée dans le parcours de
// l'enfant (QST-RACCORDEMENTS-001).
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";

export const motifCamsp = unFait("fait_motif_camsp")
  .ouiSi(given.question("Q2.2.1.b").answer().checked("6_CAMSP"))
  .nonSiEcartee(given.question("Q2.2.1.b").answer(), "6_CAMSP")
  .ouiSi(given.question("Q2.1").answer().is("10_CAMSP"))
  .sinon("Ni Q2.1, ni Q2.2.1 n'établissent encore le CAMSP.");
