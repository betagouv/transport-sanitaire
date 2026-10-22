// Les réponses lues à travers les pages, dans l'ordre : les questions qui se
// posent, telles qu'elles se posent (`asked-question.ts`), et ce qui en est
// validé, avec ce qui s'y proposait.
//
// Les questions se lisent dans l'ordre. Chacune voit celles qui la précèdent
// et qui sont validées : ses conditions peuvent en dépendre, pas de la suite.
// Ses incohérences ne voient pas non plus les réponses des pages suivantes.

import type { AskedQuestion } from "./asked-question.ts";
import { GivenAnswers } from "./given-answers.ts";
import type {
  Answer,
  Answers,
  AnyCibles,
  Page,
  Question,
  Unanswered,
  Validated,
} from "./question.ts";
import type { SeenAnswers } from "./question-context.ts";
import { ValidatedAnswers } from "./validated-answers.ts";

/** Une page lue : ses questions qui se posent, telles qu'elles se posent. */
export type AskedPage = {
  readonly page: Page;
  readonly questions: readonly AskedQuestion[];
};

/**
 * Ces pages lues dans l'ordre, question par question : ce qui s'y pose, ce qui
 * en est validé, et si toutes les questions posées ont leur réponse. Dès
 * qu'une question attend sa réponse, plus rien n'est validé : ce qui la suit se
 * pose encore, mais ne compte pas. `Questionnaire.readWith` la lit
 * (`questionnaire.ts`).
 */
export function readInOrder(
  pages: readonly Page[],
  answers: Answers,
  cibles?: AnyCibles,
): { readonly asked: readonly AskedPage[] } & Progress {
  let progress: Progress = { validated: {}, complete: true };
  const asked: AskedPage[] = [];
  for (const [rank, page] of pages.entries()) {
    const earlier = answersUpTo(pages, rank, answers);
    const read = askPage(page, { answers, earlier, cibles }, progress);
    asked.push({ page, questions: read.questions });
    progress = read.progress;
  }
  return { asked, ...progress };
}

// ---- implémentation ----

// Où en est la lecture du questionnaire : les questions validées jusqu'ici, et
// si aucune n'attend encore sa réponse.
type Progress = { readonly validated: Validated; readonly complete: boolean };

// Ce que les questions d'une page peuvent lire : les réponses, celles qu'en
// voient leurs incohérences (sans les pages suivantes), et les cibles.
type Context = {
  readonly answers: Answers;
  readonly earlier: Answers;
  readonly cibles?: AnyCibles;
};

// Les questions de la page qui se posent, dans l'ordre. Chacune voit ce que les
// précédentes ont validé.
function askPage(page: Page, context: Context, start: Progress) {
  let progress = start;
  const questions: AskedQuestion[] = [];
  for (const declared of page.questions) {
    const question = askQuestion(declared, context, progress.validated);
    if (!question) continue;
    questions.push(question);
    progress = validateInTurn(progress, question, context.answers);
  }
  return { questions, progress };
}

// La question telle qu'elle se pose, ou `undefined` quand elle ne se pose pas.
function askQuestion(
  declared: Question,
  { answers, earlier, cibles }: Context,
  validated: Validated,
): AskedQuestion | undefined {
  const read = new ValidatedAnswers(validated);
  const seenWith = (given: Answers): SeenAnswers => ({
    answers: new GivenAnswers(given),
    cibles,
    validated: read,
  });
  return declared.askedIn(seenWith(answers), seenWith(earlier));
}

// Une question qui a sa réponse est validée, si aucune n'attend avant elle. La
// première qui attend arrête la validation pour toute la suite.
function validateInTurn(
  progress: Progress,
  question: AskedQuestion,
  answers: Answers,
): Progress {
  const answer = answers[question.id];
  const complete = progress.complete && question.isAnsweredBy(answer);
  if (!complete) return { ...progress, complete };
  const validated = asValidated(question, answer);
  return {
    complete,
    validated: { ...progress.validated, [question.id]: validated },
  };
}

// Ce qu'on retient d'une question validée : ses options du moment, et sa
// réponse s'il y en a une.
function asValidated(question: AskedQuestion, answer: Answer | Unanswered) {
  const offered = question.offeredValues();
  const given = question.kept(answer);
  return {
    ...(offered && { offered }),
    ...(given !== undefined && { answer: given }),
  };
}

// Les réponses, sans celles des questions des pages qui suivent celle-ci. Les
// réponses acquises avant le verrou n'ont pas de page ici : elles restent.
function answersUpTo(
  pages: readonly Page[],
  rank: number,
  answers: Answers,
): Answers {
  const later = pages
    .slice(rank + 1)
    .flatMap((page) => page.questions.map((question) => question.id));
  return Object.fromEntries(
    Object.entries(answers).filter(([id]) => !later.includes(id)),
  );
}
