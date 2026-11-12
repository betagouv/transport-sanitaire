// Q2.3.1.finalite : la finalité de soins d'un trajet de plus de 150 km
// (QST-FINALITE-LONGUE-DISTANCE). La distance seule n'ouvre plus l'accord
// préalable : il faut un soin ou un examen adapté. La question ne se pose que
// si aucune réponse d'avant ne le prouve et que la réponse change l'issue
// (`cible_finalite_longue_distance_decisive`). Non n'écarte que ce fondement.
//
// Elle a deux places, comme l'urgence (ADR-29) : la page du trajet, après la
// distance et la série, qui peut la rendre inutile, avant l'urgence ; puis
// celle de la branche, si le trajet ne l'a pas posée.

import { given, question } from "../../question.ts";

export const Q2_3_1_FINALITE = question
  .singleChoice(
    "Q2.3.1.finalite",
    "Ce déplacement est-il nécessaire pour recevoir des soins ou passer un examen adapté à l’état de santé du patient ?",
  )
  .options({
    "1_OUI": "Oui.",
    "2_NON": "Non.",
  })
  .mattersWhile(given.cible("cible_finalite_longue_distance_decisive").isOui());
