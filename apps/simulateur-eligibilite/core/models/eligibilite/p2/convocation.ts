// La convocation : quand Q2.10 se pose (D-108). Son fait vit sous `faits/`.

import { given } from "../question.ts";

/**
 * Une convocation est annoncée, par Q2.1 ou par Q2.2.1.b : Q2.10 se pose
 * alors. Sans l'une ni l'autre, elle ne se pose pas : la convocation proposée
 * et écartée en Q2.2.1 vaut déjà « non » (contextes).
 */
export const uneConvocationAnnoncee = given
  .question("Q2.1")
  .answer()
  .is("12_CONVOCATION")
  .or(given.question("Q2.2.1.b").answer().checked("13_CONVOCATION"));

/** Q2.10 dit un appareillage : Q2.10.a et Q2.10.b se posent alors. */
export const unAppareillage = given
  .question("Q2.10")
  .answer()
  .is("6_APPAREILLAGE");
