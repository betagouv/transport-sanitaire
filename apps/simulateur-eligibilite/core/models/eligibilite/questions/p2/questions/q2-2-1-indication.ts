// Q2.2.1.indication : l'indication médicale d'un retour pénitentiaire, quand
// P1 ne l'établit pas (point 33 de la v10.1.3). « Non » sort le trajet du
// circuit de prescription (`conditions/retour-penitentiaire.ts`).

import type {
  ReadByObject,
  ValidatedAnswers,
} from "../../../../../socle/index.ts";
import { Q1_1 } from "../../p1/questions/q1-1.ts";
import { Q1_2 } from "../../p1/questions/q1-2.ts";
import { Q1_3 } from "../../p1/questions/q1-3.ts";
import { given, question } from "../../question.ts";
import { uneIndicationAPoser } from "../conditions/retour-penitentiaire.ts";

export const Q2_2_1_INDICATION = question
  .singleChoice(
    "Q2.2.1.indication",
    "Ce retour nécessite-t-il un transport pour raison médicale, indépendamment des contraintes d’escorte pénitentiaire ?",
  )
  // Le `Q2.2.1.prison-medical` de l'éditeur (point 33, v10.1.3).
  .options({
    "1_OUI": "Oui.",
    "2_NON": "Non.",
  })
  .appliesWhen(uneIndicationAPoser)
  // Une modification clinique invalide la qualification (point 33).
  .dependsOn(Q1_1, Q1_2, Q1_3);

/** Le retour relève-t-il de la seule organisation pénitentiaire ? */
export function horsCircuit(
  validated: ValidatedAnswers<ReadByObject>,
): boolean {
  return validated.question(Q2_2_1_INDICATION).is("2_NON");
}

/**
 * Le trajet reste dans le circuit de prescription. Hors du circuit, plus rien
 * ne se pose : c'est la condition des pages qui suivent les contextes.
 */
export const dansLeCircuit = given
  .question(Q2_2_1_INDICATION)
  .answer()
  .is("2_NON")
  .not();
