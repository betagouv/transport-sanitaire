// Ce qui ne va pas dans une saisie : le message à afficher sous le champ.
//
// Une réponse en erreur ne compte pas : la page ne se valide pas tant qu'il en
// reste une.

import type { Answer, Question } from "./question";

/**
 * Ce qui ne va pas dans une saisie, à afficher sous le champ. `undefined`
 * quand elle convient, ou quand il n'y a encore rien à corriger.
 */
export function errorOf(
  question: Question,
  answer: Answer | undefined,
): string | undefined {
  if (answer === undefined) return undefined;
  if (question.kind === "number") return numberErrorOf(question, answer);
  if (question.kind === "multiple choice")
    return Array.isArray(answer) && answer.length > 0
      ? undefined
      : "Cochez au moins une réponse.";
  return typeof answer === "string" && answer.trim() !== ""
    ? undefined
    : "Cette réponse est attendue.";
}

// ---- implémentation ----

function numberErrorOf(
  question: Extract<Question, { kind: "number" }>,
  answer: Answer,
): string | undefined {
  if (typeof answer !== "number" || !Number.isFinite(answer))
    return "Indiquez un nombre.";
  if (question.min !== undefined && answer < question.min)
    return `Indiquez un nombre d’au moins ${question.min}.`;
  if (question.max !== undefined && answer > question.max)
    return `Indiquez un nombre d’au plus ${question.max}.`;
  return undefined;
}
