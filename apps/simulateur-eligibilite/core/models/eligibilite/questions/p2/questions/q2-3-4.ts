// Q2.3.4 : l'urgence, quand la garde de l'éditeur le dit
// (`cible_question_urgence_a_afficher`), sur les faits des questions posées
// avant elle. Q2.12 la reprend en fin de P2 si la branche la dévoile.

import { given, question } from "../../question.ts";

export const Q2_3_4 = question
  .singleChoice("Q2.3.4", "Attestez-vous que ce transport est urgent ?")
  .mattersWhile(given.cible("cible_question_urgence_a_afficher").isOui());
