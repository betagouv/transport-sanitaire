// Les constructeurs des questions du modèle de démonstration. Les options
// viennent de son catalogue, et les conditions lisent ses faits.
//
// Avant le verrou, une question ne connaît pas encore les cibles ; après, elle
// les lit figées. D'où deux jeux de constructeurs.

import { questionsOf } from "../../socle/index.ts";
import type { Cibles } from "./declarations/cibles.ts";
import type { Faits } from "./declarations/faits.ts";
import { OPTIONS, type Questions } from "./declarations/questions.ts";
import { faits } from "./preconisation.ts";

/** Les constructeurs des questions posées avant le verrou. */
export const question = questionsOf<Questions, Faits>({
  options: OPTIONS,
  faits: (answers, validated) => faits(answers, validated),
});

/** Les constructeurs des questions posées après le verrou. */
export const questionDuComplement = questionsOf<Questions, Faits, Cibles>({
  options: OPTIONS,
  faits: (answers, validated) => faits(answers, validated),
});
