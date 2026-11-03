// Les constructeurs des questions du modèle de démonstration. Les options
// viennent de son catalogue. Les conditions lisent ses faits, et les cibles
// que ses règles en tirent (`question/asked/context.ts`).

import { givenOf, questionsOf } from "../../../socle/index.ts";
import { cibles } from "../cibles/evaluation.ts";
import type { Cibles } from "../cibles/noms.ts";
import { CATALOGUE_DES_FAITS } from "../faits/index.ts";
import type { Faits } from "../faits/noms.ts";
import { OPTIONS, type Questions } from "./catalogue.ts";

/** Les entrées des conditions du modèle de démonstration. */
export const given = givenOf<Questions, Faits, Cibles>();

export const question = questionsOf<Questions, Faits, Cibles>({
  options: OPTIONS,
  faits: CATALOGUE_DES_FAITS,
  cibles,
});
