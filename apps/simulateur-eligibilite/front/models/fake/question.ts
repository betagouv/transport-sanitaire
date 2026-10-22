// Les constructeurs des questions du modèle de démonstration. Les options
// viennent de son catalogue, et les conditions lisent ses faits.
//
// Avant le verrou, une question ne connaît pas encore les cibles ; après, elle
// les lit figées. D'où deux jeux de constructeurs.

import { questionsOf } from "../../socle";
import type { Cibles } from "./declarations/cibles";
import type { Faits } from "./declarations/faits";
import { OPTIONS, type Questions } from "./declarations/questions";
import { faits } from "./preconisation";

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
