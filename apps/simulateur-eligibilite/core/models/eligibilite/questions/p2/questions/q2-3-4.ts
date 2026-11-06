// Q2.3.4 : l'urgence, quand la garde de l'éditeur le dit
// (`cible_question_urgence_a_afficher`), sur les faits des questions posées
// avant elle. Elle a deux places : la page du trajet, puis celle de la branche
// (ADR-29). Une condition que la branche établit (le dispositif maternité)
// la pose là, si le trajet ne l'a pas posée. L'éditeur nomme Q2.12 cette
// reprise de Q2.3 sur la page de branche (`CONTRAT_SAISIES_ET_PAGES.md`).

import { given, question } from "../../question.ts";

export const Q2_3_4 = question
  .singleChoice("Q2.3.4", "Attestez-vous que ce transport est urgent ?")
  .options({
    "1_OUI": "Oui.",
    "2_NON": "Non.",
  })
  .mattersWhile(given.cible("cible_question_urgence_a_afficher").isOui());
