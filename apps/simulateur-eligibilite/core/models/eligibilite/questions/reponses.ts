// Les réponses du modèle : le type de la réponse de chaque question, sous
// l'identifiant que l'éditeur lui donne, tiré des parties. Les faits, R2, R3
// et les seeds les lisent ainsi, par identifiant, avec `given`.

import { type AnswersOf, givenOf } from "../../../socle/index.ts";
import type { Cibles } from "../cibles/noms.ts";
import type { Faits } from "../faits/noms.ts";
import type { COMPLEMENT } from "./p3/partie-3.ts";
import type { PARTS } from "./questionnaire.ts";

export type Questions = AnswersOf<(typeof PARTS)[number] | typeof COMPLEMENT>;

/**
 * Les entrées des lectures du modèle : `given.question("Q1.1").answer()`,
 * `given.fait(nom)`, `given.cible(nom)`, `given.today()`.
 */
export const given = givenOf<Questions, Faits, Cibles>();
