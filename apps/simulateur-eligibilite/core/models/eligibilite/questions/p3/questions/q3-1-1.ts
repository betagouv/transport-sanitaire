// Q3.1.1 : le nombre de trajets, que le sens (Q3.1.2) dit en allers simples,
// retours simples ou allers-retours. Trois allers-retours valent 3
// (`CONTRAT_Q31_QUANTITES.json`, D-246). Ce nombre ne recalcule pas la série
// de P2.

import { type Context, given, question } from "../../question.ts";
import { pmtOuDap } from "../conditions/supports-du-complement.ts";

// Q3.1.1 se pose pour la PMT et la DAP, une fois le sens choisi.
const uneQuantiteAPoser = pmtOuDap.and(
  given
    .question("Q3.1.2")
    .answer()
    .isOneOf("1_ALLER", "2_RETOUR", "3_ALLER_RETOUR_EQUIVALENT"),
);

// Les libellés de Q3.1.1, sens par sens (`CONTRAT_Q31_QUANTITES.json`).
const QUANTITES = {
  "1_ALLER": {
    question: "Combien d’allers simples cette prescription doit-elle couvrir ?",
    aide: "Un aller simple correspond à un seul trajet vers le lieu de soins.",
  },
  "2_RETOUR": {
    question:
      "Combien de retours simples cette prescription doit-elle couvrir ?",
    aide: "Un retour simple correspond à un seul trajet depuis le lieu de soins.",
  },
  "3_ALLER_RETOUR_EQUIVALENT": {
    question: "Combien d’allers-retours cette prescription doit-elle couvrir ?",
    aide: "Un aller-retour comprend deux trajets : un aller et un retour. Exemple : 3 allers-retours = 3 allers et 3 retours.",
  },
} as const;

// Le sens de Q3.1.2 qui a une unité. Q3.1.1 ne se pose qu'avec l'un d'eux
// (`uneQuantiteAPoser`) : l'aller tient lieu de défaut.
function sensDeQ312(answers: Context["answers"]): keyof typeof QUANTITES {
  const sens = answers.question("Q3.1.2").value;
  return sens !== undefined && sens in QUANTITES
    ? (sens as keyof typeof QUANTITES)
    : "1_ALLER";
}

// Le libellé de Q3.1.1 : il dit l'unité du sens choisi.
function quantiteDuSens({ answers }: Context): string {
  return QUANTITES[sensDeQ312(answers)].question;
}

// L'aide de Q3.1.1 : ce que vaut une unité du sens choisi.
function aideDuSens({ answers }: Context): string {
  return QUANTITES[sensDeQ312(answers)].aide;
}

export const Q3_1_1 = question
  .number("Q3.1.1", "Combien de trajets cette prescription doit-elle couvrir ?")
  .labelFrom(quantiteDuSens)
  .hintFrom(aideDuSens)
  .integer()
  .min(1)
  .mattersWhile(uneQuantiteAPoser)
  // Un autre sens change l'unité : le nombre se ressaisit.
  .dependsOn("Q3.1.2");
