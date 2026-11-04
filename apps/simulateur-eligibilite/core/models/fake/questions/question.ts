// Les constructeurs des questions du modèle de démonstration. Chaque question
// porte ses options. Les conditions lisent ses faits, et les cibles que ses
// règles en tirent (`question/asked/context.ts`).
//
// Une question lit celles d'avant par leur objet : `given.question(BOISSON)`.
// Le type `Questions` se tire des parties (`reponses.ts`) : le lire ici
// tournerait en rond.

import {
  givenOf,
  questionsOf,
  type ReadByObject,
} from "../../../socle/index.ts";
import { cibles } from "../cibles/evaluation.ts";
import type { Cibles } from "../cibles/noms.ts";
import { CATALOGUE_DES_FAITS } from "../faits/index.ts";
import type { Faits } from "../faits/noms.ts";

/** Les entrées des conditions du modèle de démonstration. */
export const given = givenOf<ReadByObject, Faits, Cibles>();

export const question = questionsOf<ReadByObject, Faits, Cibles>({
  faits: CATALOGUE_DES_FAITS,
  cibles,
});
