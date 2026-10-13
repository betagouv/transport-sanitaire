// Ce qui ne va pas dans une saisie : le message à afficher sous le champ.
//
// Une réponse en erreur ne compte pas : la page ne se valide pas tant qu'il en
// reste une.

import { addressErrors, isAddress } from "./address";
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
  if (question.kind === "address") return addressErrorOf(question, answer);
  if (question.kind === "number") return numberErrorOf(question, answer);
  if (question.kind === "date" || question.kind === "datetime")
    return dateErrorOf(question, answer);
  if (question.kind === "multiple choice")
    return Array.isArray(answer) && answer.length > 0
      ? (incompatibilityOf(question, answer) ?? blockOf(question, answer))
      : "Cochez au moins une réponse.";
  if (typeof answer !== "string" || answer.trim() === "")
    return "Cette réponse est attendue.";
  return question.kind === "single choice"
    ? blockOf(question, [answer])
    : undefined;
}

// ---- implémentation ----

// Une adresse a un message par champ, rendu sous chacun (`address.ts`). Ici, le
// premier suffit : il dit qu'il reste quelque chose à corriger.
function addressErrorOf(
  question: Extract<Question, { kind: "address" }>,
  answer: Answer,
): string | undefined {
  if (!isAddress(answer)) return "Cette réponse est attendue.";
  return Object.values(addressErrors(question, answer))[0];
}

// L'écran ne laisse pas cocher deux options incompatibles. Ceci couvre une
// réponse venue d'ailleurs, comme une seed.
function incompatibilityOf(
  question: Extract<Question, { kind: "multiple choice" }>,
  checked: readonly string[],
): string | undefined {
  return question.incompatibleOptions?.find(({ values }) =>
    values.every((value) => checked.includes(value)),
  )?.explanation;
}

// Le message de la première option choisie qui bloque, s'il y en a une.
function blockOf(
  question: Extract<Question, { kind: "single choice" | "multiple choice" }>,
  chosen: readonly string[],
): string | undefined {
  return question.options.find(
    (option) => option.blocks !== undefined && chosen.includes(option.value),
  )?.blocks;
}

// Les bornes s'écrivent comme la réponse, au format ISO : l'ordre des textes
// est alors celui des dates.
function dateErrorOf(
  question: Extract<Question, { kind: "date" | "datetime" }>,
  answer: Answer,
): string | undefined {
  if (typeof answer !== "string" || answer.trim() === "")
    return "Cette réponse est attendue.";
  const { min, max } = question;
  if (min !== undefined && answer < min)
    return `Indiquez une date à partir du ${displayedDate(min)}.`;
  if (max !== undefined && answer > max)
    return `Indiquez une date au plus tard le ${displayedDate(max)}.`;
  return undefined;
}

// « 2026-10-12T08:30 » se lit « 12/10/2026 à 08:30 ».
function displayedDate(iso: string): string {
  const [date = "", time] = iso.split("T");
  const [year, month, day] = date.split("-");
  const displayed = `${day}/${month}/${year}`;
  return time ? `${displayed} à ${time.slice(0, 5)}` : displayed;
}

function numberErrorOf(
  question: Extract<Question, { kind: "number" }>,
  answer: Answer,
): string | undefined {
  if (typeof answer !== "number" || !Number.isFinite(answer))
    return "Indiquez un nombre.";
  if (question.integer && !Number.isInteger(answer))
    return "Indiquez un nombre entier, sans décimale.";
  if (question.min !== undefined && answer < question.min)
    return `Indiquez un nombre d’au moins ${question.min}.`;
  if (question.max !== undefined && answer > question.max)
    return `Indiquez un nombre d’au plus ${question.max}.`;
  return undefined;
}
