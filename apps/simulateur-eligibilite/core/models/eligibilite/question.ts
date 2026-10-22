// Les constructeurs des questions du modèle : `question.singleChoice("Q1.1",
// "Concernant son déplacement, le patient :")`, puis un réglage par ligne. Les
// options viennent du catalogue de l'éditeur, et les gardes lisent les faits
// des questions validées avant elles.
//
// Une garde ne lit jamais la complétude de P1 ni de P2 : la constater pose les
// questions, donc lit leurs gardes. Le catalogue la laisse inconnue.

import { type QuestionContext, questionsOf } from "../../socle/index.ts";
import { CATALOGUE_DES_FAITS } from "./catalogue-des-faits.ts";
import type { Cibles } from "./declarations/cibles.ts";
import type { Faits } from "./declarations/faits.ts";
import { OPTIONS, type Questions } from "./declarations/questions.ts";

/** Ce que lit une condition déclarée hors de son constructeur. */
export type Context = QuestionContext<Questions, undefined, Faits>;

/** Ce que lit une condition de P3 : les cibles figées au verrou en plus. */
export type ContextDuComplement = QuestionContext<Questions, Cibles, Faits>;

/** Les constructeurs des questions de P0 à P2. */
export const question = questionsOf<Questions, Faits>({
  options: OPTIONS,
  faits: (answers, validated) => CATALOGUE_DES_FAITS.read(answers, validated),
});

/** Les constructeurs des questions de P3, posées après le verrou. */
export const questionDuComplement = questionsOf<Questions, Faits, Cibles>({
  options: OPTIONS,
  faits: (answers, validated) => CATALOGUE_DES_FAITS.read(answers, validated),
});
