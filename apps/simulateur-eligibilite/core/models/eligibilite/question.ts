// Les constructeurs des questions du modèle : `question.singleChoice("Q1.1",
// "Concernant son déplacement, le patient :")`, puis un réglage par ligne. Les
// options viennent du catalogue de l'éditeur. Les gardes lisent les faits des
// questions validées avant elles, et les cibles que les règles en tirent :
// figées au verrou, sinon calculées sur ces faits.
//
// Une garde ne lit jamais la complétude de P1 ni de P2 : la constater pose les
// questions, donc lit leurs gardes. Le catalogue la laisse inconnue.

import {
  givenOf,
  type QuestionContext,
  questionsOf,
} from "../../socle/index.ts";
import type { Cibles } from "./declarations/cibles.ts";
import type { Faits } from "./declarations/faits.ts";
import { OPTIONS, type Questions } from "./declarations/questions.ts";
import { lazyCibles } from "./evaluation-des-regles.ts";
import { CATALOGUE_DES_FAITS } from "./faits/index.ts";

/** La réponse qui le dirait n'est pas donnée : on ne le sait pas encore. */
export type Inconnu = undefined;

/** Ce que lit une condition déclarée hors de son constructeur. */
export type Context = QuestionContext<Questions, Cibles, Faits>;

/**
 * Les entrées des conditions : `given.question("Q1.1").answer()`,
 * `given.fait(nom)`, `given.cible(nom)`, `given.today()`.
 */
export const given = givenOf<Questions, Faits, Cibles>();

/** Les constructeurs des questions de P0 à P3. */
export const question = questionsOf<Questions, Faits, Cibles>({
  options: OPTIONS,
  faits: (answers, validated) => CATALOGUE_DES_FAITS.read(answers, validated),
  cibles: lazyCibles,
});
