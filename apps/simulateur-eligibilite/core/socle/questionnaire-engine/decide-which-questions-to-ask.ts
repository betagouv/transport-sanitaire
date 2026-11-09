// Les réponses lues à travers les pages, dans l'ordre : les questions qui se
// posent, telles qu'elles se posent (`question/asked/question.ts`), et ce qui en est
// validé, avec ce qui s'y proposait.
//
// Les questions se lisent dans l'ordre. Chacune voit celles qui la précèdent
// et qui sont validées : ses conditions peuvent en dépendre, pas de la suite.
// Ses incohérences ne voient pas non plus les réponses des pages suivantes.
//
// Seules les pages posées après le verrou reçoivent les cibles figées. Les
// autres lisent celles que le modèle calcule sur leurs faits
// (`question/asked/context.ts`), même relues après le verrou.
//
// Avec une pertinence, une question dont la réponse ne change rien de ce qui
// compte ne se pose pas (`does-a-question-still-matter/matters.ts`, #255) : elle n'est jamais validée.
//
// Une question à plusieurs places se pose à la première où ses gardes tiennent
// et qui compte (ADR-29). Une place suivante ne la pose pas si elle s'est déjà
// posée plus tôt, validée ou en attente.

import { GivenAnswers } from "./answers/given-answers.ts";
import { ValidatedAnswers } from "./answers/validated-answers.ts";
import {
  type GuardPlace,
  guardReading,
  type Positions,
} from "./conditions/what-a-condition-sees.ts";
import type { Relevance } from "./does-a-question-still-matter/matters.ts";
import type { SeenAnswers } from "./question/asked/context.ts";
import type { AskedQuestion } from "./question/asked/question.ts";
import type {
  Answer,
  Answers,
  AnyCibles,
  NotAsked,
  Page,
  Question,
  Unanswered,
  Validated,
} from "./question/question.ts";

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
  { pages, positions }: { pages: readonly Page[]; positions: Positions },
  answers: Answers,
  { cibles, relevance }: { cibles?: AnyCibles; relevance?: Relevance } = {},
): { readonly asked: readonly AskedPage[] } & Progress {
  let progress: Progress = { validated: {}, complete: true, pending: [] };
  const asked: AskedPage[] = [];
  for (const [rank, page] of pages.entries()) {
    const earlier = answersUpTo(positions, rank, answers);
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
    if (declared.isLaterPlace && askedBefore(declared.id, progress)) continue;
    const place: GuardPlace = {
      id: declared.id,
      at: { page: context.rank, index },
      positions: context.positions,
      onPage: new Map(questions.map((asked) => [asked.id, asked])),
      validated: progress.validated,
      answers: context.answers,
    };
    const question = askQuestion(declared, context, place);
    if (!question || !matters(declared, context, progress)) continue;
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

// Une place suivante est sautée si la question s'est posée plus tôt.
function askedBefore(id: string, { validated, pending }: Progress): boolean {
  return id in validated || pending.includes(id);
}

// Sans pertinence, toute question qui se pose compte. Elle compte à sa place.
function matters(
  declared: Question,
  context: Context,
  progress: Progress,
): boolean {
  const { relevance, cibles } = context;
  const { validated, pending } = progress;
  return relevance?.matters(declared, { validated, pending, cibles }) ?? true;
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

// Les réponses, sans celles des questions dont la première place suit cette
// page. Les réponses acquises avant le verrou n'ont pas de page ici : elles
// restent.
function answersUpTo(
  positions: Positions,
  rank: number,
  answers: Answers,
): Answers {
  return Object.fromEntries(
    Object.entries(answers).filter(
      ([id]) => (positions.of(id)?.page ?? rank) <= rank,
    ),
  );
}
