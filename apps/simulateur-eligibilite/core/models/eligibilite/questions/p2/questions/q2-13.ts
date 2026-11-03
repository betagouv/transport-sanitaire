// Q2.13 : le départ d'une entrée en établissement, sur la page de branche.
//
// Elle se pose quand une entrée en établissement de santé laisse
// `fait_transfert_article80` absent, ce qui envoie à la caisse : la nature du
// départ dit si l'entrée est simple.

import { given, question } from "../../question.ts";
import { brancheDecisive } from "../conditions/branche.ts";

const unDepartAPoser = given
  .question("Q2.1.g")
  .answer()
  .is("1_ENTREE")
  .and(given.fait("fait_hospitalisation").isOui())
  .and(given.fait("fait_transfert_article80").isInconnu())
  .and(brancheDecisive);

export const Q2_13_DEPART = question
  .singleChoice("Q2.13.depart", "Le patient devra effectuer son départ depuis…")
  .mattersWhile(unDepartAPoser);
