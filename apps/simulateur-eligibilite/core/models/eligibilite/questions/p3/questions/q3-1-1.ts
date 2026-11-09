// Q3.1.1 : le nombre de trajets, que le sens choisi (Q2.13.sens ou Q3.1.2,
// `sens-du-trajet.ts`) dit en allers simples,
// retours simples ou allers-retours. Trois allers-retours valent 3
// (`CONTRAT_Q31_QUANTITES.json`, D-246). Ce nombre ne recalcule pas la série
// de P2.

import { Q2_13_SENS } from "../../p2/questions/q2-13.ts";
import { type Context, question } from "../../question.ts";
import { SENS_CHOISI, sensChoisi } from "../conditions/sens-du-trajet.ts";
import { pmtOuDap } from "../conditions/supports-du-complement.ts";
import { Q3_1_2 } from "./q3-1-2.ts";

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

// Q3.1.1 se pose pour la PMT et la DAP, une fois choisi un sens qui a une
// unité.
const uneQuantiteAPoser = pmtOuDap.and(
  SENS_CHOISI.compute((sens) => sens !== undefined && sens in QUANTITES),
);

// Le sens choisi qui a une unité. Q3.1.1 ne se pose qu'avec l'un d'eux
// (`uneQuantiteAPoser`) : l'aller tient lieu de défaut.
function sensAvecUnite(answers: Context["answers"]): keyof typeof QUANTITES {
  const sens = sensChoisi({
    trajetEvalue: answers.question(Q2_13_SENS),
    sens: answers.question(Q3_1_2),
  });
  return sens !== undefined && sens in QUANTITES
    ? (sens as keyof typeof QUANTITES)
    : "1_ALLER";
}

// Le libellé de Q3.1.1 : il dit l'unité du sens choisi.
function quantiteDuSens({ answers }: Context): string {
  return QUANTITES[sensAvecUnite(answers)].question;
}

// L'aide de Q3.1.1 : ce que vaut une unité du sens choisi.
function aideDuSens({ answers }: Context): string {
  return QUANTITES[sensAvecUnite(answers)].aide;
}

export const Q3_1_1 = question
  .number("Q3.1.1", "Combien de trajets cette prescription doit-elle couvrir ?")
  .labelFrom(quantiteDuSens)
  .hintFrom(aideDuSens)
  .integer()
  .min(1)
  .mattersWhile(uneQuantiteAPoser)
  // Un autre sens change l'unité : le nombre se ressaisit.
  .dependsOn(Q3_1_2);
