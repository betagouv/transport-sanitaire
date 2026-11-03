// Q2.10 : la convocation, après la permission, pour la catégorie, et sur la
// même page, pour l'appareillage, l'agrément du fournisseur (Q2.10.a) et
// l'appareillage concerné (Q2.10.b) (D-108). Son fait vit sous `faits/`.
//
// Q2.10 se pose quand Q2.1 dit une convocation, ou que Q2.2.1.b en signale une
// (option 13). Elle n'est jamais reproposée si Q2.1 l'a déjà dite : Q2.2.1.b la
// retire. Sans l'une ni l'autre, elle ne se pose pas : la convocation proposée
// et écartée en Q2.2.1.b vaut déjà « non ».

import { given, question } from "../../question.ts";

const uneConvocationAnnoncee = given
  .question("Q2.1")
  .answer()
  .is("12_CONVOCATION")
  .or(given.question("Q2.2.1.b").answer().checked("13_CONVOCATION"));

// Q2.10 dit un appareillage : Q2.10.a et Q2.10.b se posent ensemble.
const unAppareillage = given.question("Q2.10").answer().is("6_APPAREILLAGE");

export const Q2_10 = question
  .singleChoice(
    "Q2.10",
    "Quelle convocation, quel avis d’audience ou quel appareillage motive ce trajet ?",
  )
  .appliesWhen(uneConvocationAnnoncee);

export const Q2_10_A = question
  .singleChoice(
    "Q2.10.a",
    "Le fournisseur est-il agréé pour cet appareillage ?",
  )
  .appliesWhen(unAppareillage)
  .dependsOn("Q2.10");

export const Q2_10_B = question
  .singleChoice("Q2.10.b", "Sélectionnez l’appareillage concerné")
  .appliesWhen(unAppareillage)
  .dependsOn("Q2.10");
