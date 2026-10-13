// Ce qu'une réponse vaut pour sa question : réduite aux options qui s'y
// proposent, et suffisante ou non pour la quitter.

import { errorOf } from "./answer-error";
import type { Answer, Question } from "./question";

/**
 * Les valeurs qu'une réponse à cette question peut porter, l'option exclusive
 * comprise. `undefined` : une saisie libre.
 */
export function optionValues(question: Question): string[] | undefined {
  return question.kind === "single choice" ||
    question.kind === "multiple choice"
    ? valuesOf(question)
    : undefined;
}

/**
 * La réponse, réduite aux options de la question. `undefined` quand il n'en
 * reste rien. Une saisie libre est rendue telle quelle.
 */
export function offeredAnswer(
  question: Question,
  answer: Answer | undefined,
): Answer | undefined {
  if (question.kind === "single choice")
    return valuesOf(question).includes(answer as string) ? answer : undefined;
  if (question.kind !== "multiple choice" || !Array.isArray(answer))
    return answer;
  const offered = answer.filter((value) => valuesOf(question).includes(value));
  return offered.length > 0 ? offered : undefined;
}

/** La réponse suffit-elle à quitter la question ? */
export function isAnswered(question: Question, answer: Answer | undefined) {
  const offered = offeredAnswer(question, answer);
  if (offered === undefined) return question.optional === true;
  return errorOf(question, offered) === undefined;
}

// ---- implémentation ----

// Les valeurs des options d'un choix, l'option exclusive comprise.
function valuesOf(
  question: Extract<Question, { kind: "single choice" | "multiple choice" }>,
): string[] {
  const exclusive =
    question.kind === "multiple choice" ? question.exclusiveOption : undefined;
  return [...question.options, ...(exclusive ? [exclusive] : [])].map(
    (option) => option.value,
  );
}
