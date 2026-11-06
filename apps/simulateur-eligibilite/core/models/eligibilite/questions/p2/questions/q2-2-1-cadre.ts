// Q2.2.1.cadre : le cadre du séjour en cours, « déjà hospitalisé » coché en
// Q2.2.1 (TS1014-B01). Une sortie d'établissement (Q2.1.g) dit déjà
// l'établissement : le cadre ne se demande pas alors.

import { Q1_3 } from "../../p1/questions/q1-3.ts";
import { given, question } from "../../question.ts";
import {
  LIEUX_INCOMPATIBLES,
  unConflitDeLieuxApparu,
} from "../conditions/conflit-de-lieux.ts";
import { Q2_1, Q2_1_G } from "./q2-1.ts";
import { Q2_2_1 } from "./q2-2-1.ts";

/** Q2.2.1.cadre se pose : le séjour est coché, et rien n'en dit le cadre. */
const unCadreAPoser = given
  .question(Q2_2_1)
  .answer()
  .checked("1_HOSPITALISATION")
  .and(given.question(Q2_1_G).answer().is("2_SORTIE").not());

// La question, avant l'incohérence qui lit sa réponse.
const sejour = question
  .singleChoice(
    "Q2.2.1.cadre",
    "Dans quel cadre le patient est-il actuellement hospitalisé ?",
  )
  // Le `hospitalStayQuestion` de l'éditeur (TS1014-B01).
  .options({
    "1_ETABLISSEMENT": "En séjour dans un établissement de santé.",
    "2_HAD": "En Hospitalisation à Domicile (HAD).",
  })
  .appliesWhen(unCadreAPoser);

// Un séjour fixe l'établissement, ou le domicile d'une HAD.
export const Q2_2_1_CADRE = sejour.inconsistentWhen(
  unConflitDeLieuxApparu("sejour", {
    soins: Q1_3,
    motif: Q2_1,
    sousType: Q2_1_G,
    situations: Q2_2_1,
    sejour,
  }),
  LIEUX_INCOMPATIBLES,
);
