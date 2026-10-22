// Où en est un questionnaire : ses réponses validées, et la page ouverte. Le
// parcours le garde d'un écran à l'autre, une seed le reconstruit.

import { askedPages, askedQuestions } from "./asked-questions.ts";
import { isAnswered } from "./offered-answer.ts";
import type { Answers, AnyCibles, Page } from "./question.ts";

/** Où en est un questionnaire : ses réponses validées, et la page ouverte. */
export type QuestionnaireState = {
  readonly answers: Answers;
  readonly page: string;
};

/**
 * L'état qu'aurait laissé un utilisateur ayant donné ces réponses : ouvert sur
 * la première page sans réponse, sinon sur la dernière. Une seed a ainsi un
 * questionnaire derrière elle, donc un « Précédent ».
 */
export function stateAfterAnswers(
  pages: readonly Page[],
  answers: Answers,
  cibles?: AnyCibles,
): QuestionnaireState & { complete: boolean } {
  const asked = askedPages(pages, answers, cibles);
  const pending = asked.find((page) =>
    askedQuestions(pages, page, answers, cibles).some(
      (question) => !isAnswered(question, answers[question.id]),
    ),
  );
  const open = pending ?? asked.at(-1);
  if (!open) throw new Error("Ce questionnaire n'affiche aucune page.");
  return { answers, page: open.id, complete: pending === undefined };
}
