// Ce qui ne va pas dans une saisie, dit par sa nature. L'écran en écrit le
// message (`front/socle/questionnaire-engine/screen-texts.ts`). Les phrases
// livrées par l'éditeur (un blocage, une incompatibilité, une incohérence)
// restent ici, telles quelles : une API doit pouvoir les donner.
//
// Une réponse en erreur ne compte pas : la page ne se valide pas tant qu'il en
// reste une. Une erreur de format s'affiche seule. Sinon, chaque incohérence
// avec une autre réponse a la sienne.

import { addressProblems, isAddress } from "./address.ts";
import type { Answer, Question, Unanswered } from "./question.ts";

/** Ce qui ne va pas dans une saisie. */
export type AnswerProblem =
  | { readonly kind: "missing" }
  | { readonly kind: "nothing checked" }
  | { readonly kind: "not a number" }
  | { readonly kind: "not an integer" }
  | { readonly kind: "number below"; readonly min: number }
  | { readonly kind: "number above"; readonly max: number }
  /** Les bornes d'une date s'écrivent au format ISO, comme la réponse. */
  | { readonly kind: "date before"; readonly min: string }
  | { readonly kind: "date after"; readonly max: string }
  | { readonly kind: "invalid postal code" }
  /** Une phrase de l'éditeur : un blocage, une incompatibilité, une incohérence. */
  | { readonly kind: "stated"; readonly text: string };

/**
 * Ce qui ne va pas dans une saisie. Vide quand elle convient, ou quand il n'y a
 * encore rien à corriger.
 */
export function problemsOf(
  question: Question,
  answer: Answer | Unanswered,
): readonly AnswerProblem[] {
  if (answer === undefined) return [];
  const problem = formatProblemOf(question, answer);
  if (problem !== undefined) return [problem];
  return (question.inconsistencies ?? []).map(stated);
}

// ---- implémentation ----

const MISSING: AnswerProblem = { kind: "missing" };

function stated(text: string): AnswerProblem {
  return { kind: "stated", text };
}

// Ce qui ne va pas dans la saisie elle-même : son format, une réponse qui
// bloque, des options incompatibles.
function formatProblemOf(
  question: Question,
  answer: Answer,
): AnswerProblem | undefined {
  if (question.kind === "checkbox") return undefined;
  if (question.kind === "address") return addressProblemOf(question, answer);
  if (question.kind === "number") return numberProblemOf(question, answer);
  if (question.kind === "date" || question.kind === "datetime")
    return dateProblemOf(question, answer);
  if (question.kind === "multiple choice")
    return Array.isArray(answer) && answer.length > 0
      ? (incompatibilityOf(question, answer) ?? blockOf(question, answer))
      : { kind: "nothing checked" };
  if (typeof answer !== "string" || answer.trim() === "") return MISSING;
  return question.kind === "single choice"
    ? blockOf(question, [answer])
    : undefined;
}

// Une adresse a un problème par champ, montré sous chacun (`address.ts`). Ici,
// le premier suffit : il dit qu'il reste quelque chose à corriger.
function addressProblemOf(
  question: Extract<Question, { kind: "address" }>,
  answer: Answer,
): AnswerProblem | undefined {
  if (!isAddress(answer)) return MISSING;
  return Object.values(addressProblems(question, answer))[0];
}

// L'écran ne laisse pas cocher deux options incompatibles. Ceci couvre une
// réponse venue d'ailleurs, comme une seed.
function incompatibilityOf(
  question: Extract<Question, { kind: "multiple choice" }>,
  checked: readonly string[],
): AnswerProblem | undefined {
  const incompatible = question.incompatibleOptions?.find(({ values }) =>
    values.every((value) => checked.includes(value)),
  );
  return incompatible && stated(incompatible.explanation);
}

// Le blocage de la première option choisie qui bloque, s'il y en a une.
function blockOf(
  question: Extract<Question, { kind: "single choice" | "multiple choice" }>,
  chosen: readonly string[],
): AnswerProblem | undefined {
  const blocking = question.options.find(
    (option) => option.blocks !== undefined && chosen.includes(option.value),
  );
  return blocking?.blocks === undefined ? undefined : stated(blocking.blocks);
}

// Les bornes s'écrivent comme la réponse, au format ISO : l'ordre des textes
// est alors celui des dates.
function dateProblemOf(
  question: Extract<Question, { kind: "date" | "datetime" }>,
  answer: Answer,
): AnswerProblem | undefined {
  if (typeof answer !== "string" || answer.trim() === "") return MISSING;
  const { min, max } = question;
  if (min !== undefined && answer < min) return { kind: "date before", min };
  if (max !== undefined && answer > max) return { kind: "date after", max };
  return undefined;
}

function numberProblemOf(
  question: Extract<Question, { kind: "number" }>,
  answer: Answer,
): AnswerProblem | undefined {
  if (typeof answer !== "number" || !Number.isFinite(answer))
    return { kind: "not a number" };
  if (question.integer && !Number.isInteger(answer))
    return { kind: "not an integer" };
  const { min, max } = question;
  if (min !== undefined && answer < min) return { kind: "number below", min };
  if (max !== undefined && answer > max) return { kind: "number above", max };
  return undefined;
}
