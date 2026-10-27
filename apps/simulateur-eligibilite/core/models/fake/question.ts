// Les constructeurs des questions du modèle de démonstration. Les options
// viennent de son catalogue. Les conditions lisent ses faits, et les cibles
// que ses règles en tirent (`question-context.ts`).

import { givenOf, questionsOf } from "../../socle/index.ts";
import type { Cibles } from "./declarations/cibles.ts";
import type { Faits } from "./declarations/faits.ts";
import { OPTIONS, type Questions } from "./declarations/questions.ts";
import { cibles, faits } from "./preconisation.ts";

/** Les entrées des conditions du modèle de démonstration. */
export const given = givenOf<Questions, Faits, Cibles>();

export const question = questionsOf<Questions, Faits, Cibles>({
  options: OPTIONS,
  faits: (answers, validated) => faits(answers, validated),
  cibles,
});
