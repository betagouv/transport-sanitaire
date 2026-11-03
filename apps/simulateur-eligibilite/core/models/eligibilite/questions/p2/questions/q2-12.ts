// Q2.12 : l'urgence, reprise de Q2.3.4 en fin de P2, sur la page de branche.
//
// Elle se pose par la garde de l'éditeur pour l'urgence,
// `cible_question_urgence_a_afficher`, lue sur tous les faits de P2, ceux de la
// branche compris. Une condition que la branche vient d'établir (le dispositif
// maternité) dévoile alors la question que la page du trajet avait masquée.
// Q2.3.4 validée, l'urgence ne se redemande jamais.

import { given, question } from "../../question.ts";

const uneUrgenceDevoilee = given
  .question("Q2.3.4")
  .answer()
  .compute((urgence) => !urgence.isValidated())
  .and(given.cible("cible_question_urgence_a_afficher").isOui());

export const Q2_12 = question
  .singleChoice("Q2.12", "Attestez-vous que ce transport est urgent ?")
  .mattersWhile(uneUrgenceDevoilee)
  .dependsOn("Q2.14.eloignement", "Q2.14.motif");
