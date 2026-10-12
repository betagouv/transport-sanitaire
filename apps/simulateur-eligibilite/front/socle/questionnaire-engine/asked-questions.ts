// Ce qui s'affiche, vu les réponses : les pages, leurs questions, et la forme
// que chaque question prend à ce moment-là.
//
// Une question se pose sous son libellé du moment, avec ses bornes du moment,
// et les seules options qui se proposent. Le reste du moteur ne lit que cette
// forme.

import type { Answers, AnyCibles, Option, Page, Question } from "./question";

/**
 * Les questions de la page qui se posent, vu les réponses et les cibles, telles
 * qu'elles se posent : sous leur libellé du moment, avec les seules options
 * qui se proposent.
 */
export function askedQuestions(
  page: Page,
  answers: Answers,
  cibles?: AnyCibles,
): Question[] {
  return page.questions
    .filter((question) => isAsked(question, answers, cibles))
    .map((question) => asPosed(question, answers, cibles));
}

/** Les pages qui posent au moins une question, dans l'ordre du questionnaire. */
export function askedPages(
  pages: readonly Page[],
  answers: Answers,
  cibles?: AnyCibles,
) {
  return pages.filter((page) =>
    page.questions.some((question) => isAsked(question, answers, cibles)),
  );
}

// ---- implémentation ----

function isAsked(question: Question, answers: Answers, cibles?: AnyCibles) {
  return question.askedIf?.(answers, cibles) ?? true;
}

function asPosed(
  question: Question,
  answers: Answers,
  cibles?: AnyCibles,
): Question {
  const posed = (options: readonly Option[]) =>
    posedOptions(options, answers, cibles);
  const texts = posedTexts(question, answers, cibles);
  if (question.kind === "date" || question.kind === "datetime")
    return { ...question, ...texts, ...question.boundsFrom?.(answers, cibles) };
  if (question.kind === "single choice")
    return { ...question, ...texts, options: posed(question.options) };
  if (question.kind !== "multiple choice") return { ...question, ...texts };
  const { exclusiveOption: exclusive } = question;
  const [exclusiveOption] = posed(exclusive ? [exclusive] : []);
  return {
    ...question,
    ...texts,
    options: posed(question.options),
    exclusiveOption,
  };
}

// Ce qui se lit autour du champ, vu les réponses : le libellé, et le rappel.
function posedTexts(question: Question, answers: Answers, cibles?: AnyCibles) {
  const asked = question.labelFrom?.(answers, cibles) ?? question.label;
  return {
    label: question.optional ? `${asked} (facultatif)` : asked,
    reminder: question.reminderFrom?.(answers, cibles) ?? question.reminder,
  };
}

// Les options qui se proposent, vu les réponses, sous leur libellé du moment.
function posedOptions(
  options: readonly Option[],
  answers: Answers,
  cibles?: AnyCibles,
): Option[] {
  return options
    .filter((option) => option.offeredIf?.(answers, cibles) ?? true)
    .map((option) => ({
      ...option,
      label: option.labelFrom?.(answers, cibles) ?? option.label,
      help: option.helpFrom?.(answers, cibles) ?? option.help,
    }));
}
