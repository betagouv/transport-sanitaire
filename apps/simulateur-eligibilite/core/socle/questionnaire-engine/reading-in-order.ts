// Les réponses lues à travers les pages, dans l'ordre : les questions qui se
// posent, telles qu'elles se posent (`asked-question.ts`), et ce qui en est
// validé, avec ce qui s'y proposait.
//
// Les questions se lisent dans l'ordre. Chacune voit celles qui la précèdent
// et qui sont validées : ses conditions peuvent en dépendre, pas de la suite.
// Ses incohérences ne voient pas non plus les réponses des pages suivantes.
//
// Seules les pages posées après le verrou reçoivent les cibles figées. Les
// autres lisent celles que le modèle calcule sur leurs faits
// (`question-context.ts`), même relues après le verrou.
//
// Avec une pertinence, une question dont la réponse ne change rien de ce qui
// compte ne se pose pas (`relevance.ts`, #255) : elle n'est jamais validée.

import { type GuardPlace, guardReading, Positions } from "./answer-readings.ts";
import type { AskedQuestion } from "./asked-question.ts";
import { GivenAnswers } from "./given-answers.ts";
import type {
  Answer,
  Answers,
  AnyCibles,
  NotAsked,
  Page,
  Question,
  Unanswered,
  Validated,
} from "./question.ts";
import type { SeenAnswers } from "./question-context.ts";
import type { Relevance } from "./relevance.ts";
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
  { cibles, relevance }: { cibles?: AnyCibles; relevance?: Relevance } = {},
): { readonly asked: readonly AskedPage[] } & Progress {
  let progress: Progress = { validated: {}, complete: true, pending: [] };
  const asked: AskedPage[] = [];
  const positions = new Positions(pages);
  for (const [rank, page] of pages.entries()) {
    const earlier = answersUpTo(pages, rank, answers);
    const frozen = page.afterLock ? cibles : undefined;
    const context = {
      ...{ answers, earlier, cibles: frozen, positions, rank },
      relevance,
    };
    const read = askPage(page, context, progress);
    asked.push({ page, questions: read.questions });
    progress = read.progress;
  }
  return { asked, ...progress };
}

// ---- implémentation ----

// Où en est la lecture du questionnaire : les questions validées jusqu'ici, si
// aucune n'attend encore sa réponse, et celles qui se posent sans être validées.
type Progress = {
  readonly validated: Validated;
  readonly complete: boolean;
  readonly pending: readonly string[];
};

// Ce que les questions d'une page peuvent lire : les réponses, celles qu'en
// voient leurs incohérences (sans les pages suivantes), et les cibles.
// `positions` et `rank` : où se trouvent les questions, et la page lue.
type Context = {
  readonly answers: Answers;
  readonly earlier: Answers;
  readonly cibles?: AnyCibles;
  readonly positions: Positions;
  readonly rank: number;
  readonly relevance?: Relevance;
};

// Les questions de la page qui se posent, dans l'ordre. Chacune voit ce que les
// précédentes ont validé, et celles de la page posées avant elle.
function askPage(page: Page, context: Context, start: Progress) {
  let progress = start;
  const questions: AskedQuestion[] = [];
  for (const [index, declared] of page.questions.entries()) {
    const place: GuardPlace = {
      id: declared.id,
      at: { page: context.rank, index },
      positions: context.positions,
      onPage: new Map(questions.map((asked) => [asked.id, asked])),
      validated: progress.validated,
      answers: context.answers,
    };
    const question = askQuestion(declared, context, place);
    if (!question || !matters(question.id, context, progress)) continue;
    questions.push(question);
    progress = validateInTurn(progress, question, context.answers);
  }
  return { questions, progress };
}

// La question telle qu'elle se pose, ou `NotAsked`. Ses conditions lisent les
// réponses à sa place ; ses incohérences lisent aussi la sienne.
function askQuestion(
  declared: Question,
  { answers, earlier, cibles }: Context,
  place: GuardPlace,
): AskedQuestion | NotAsked {
  const read = new ValidatedAnswers(place.validated);
  const seenWith = (given: Answers, own: boolean): SeenAnswers => ({
    answers: new GivenAnswers(given),
    cibles,
    validated: read,
    answer: guardReading(place, { own }),
  });
  return declared.askedIn(seenWith(answers, false), seenWith(earlier, true));
}

// Sans pertinence, toute question qui se pose compte.
function matters(id: string, context: Context, progress: Progress): boolean {
  const { relevance, cibles } = context;
  const { validated, pending } = progress;
  return relevance?.matters(id, { validated, pending, cibles }) ?? true;
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
  if (!complete) {
    return {
      ...progress,
      complete,
      pending: [...progress.pending, question.id],
    };
  }
  const validated = asValidated(question, answer);
  return {
    ...progress,
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
