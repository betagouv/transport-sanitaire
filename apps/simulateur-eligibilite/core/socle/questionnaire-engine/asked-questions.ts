// Ce qui s'affiche, vu les réponses : les pages, leurs questions, et la forme
// que chaque question prend à ce moment-là. Et ce qui en est validé : les
// questions qui ont leur réponse, avec ce qui s'y proposait.
//
// Une question se pose sous son libellé du moment, avec ses bornes du moment,
// les seules options qui se proposent, et une adresse dans son mode du moment.
// Le reste du moteur ne lit que cette forme.
//
// Les questions se lisent dans l'ordre. Chacune voit celles qui la précèdent
// et qui sont validées : ses conditions peuvent en dépendre, pas de la suite.
// Ses incohérences ne voient pas non plus les réponses des pages suivantes.

import { GivenAnswers } from "./given-answers.ts";
import { isAnswered, offeredAnswer, optionValues } from "./offered-answer.ts";
import type { Option } from "./option.ts";
import type {
  Answer,
  Answers,
  AnyCibles,
  Page,
  Question,
  Unanswered,
  Validated,
} from "./question.ts";
import { contextOf, type QuestionContext } from "./question-context.ts";
import { ValidatedAnswers } from "./validated-answers.ts";

/** Une page lue : ses questions qui se posent, telles qu'elles se posent. */
export type AskedPage = {
  readonly page: Page;
  readonly questions: readonly Question[];
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

// Ce qu'un rappel lit : les réponses, les cibles figées s'il y en a, les
// questions validées avant celle qu'il concerne, et leurs faits.
type Seen = QuestionContext;

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
  const questions: Question[] = [];
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
): Question | undefined {
  const read = new ValidatedAnswers(validated);
  const seenWith = (given: Answers): Seen =>
    contextOf(
      { answers: new GivenAnswers(given), cibles, validated: read },
      declared.faits,
    );
  const seen = seenWith(answers);
  if (!(declared.askedIf?.(seen) ?? true)) return undefined;
  return asAsked(declared, seen, seenWith(earlier));
}

// Une question qui a sa réponse est validée, si aucune n'attend avant elle. La
// première qui attend arrête la validation pour toute la suite.
function validateInTurn(
  progress: Progress,
  question: Question,
  answers: Answers,
): Progress {
  const answer = answers[question.id];
  const complete = progress.complete && isAnswered(question, answer);
  if (!complete) return { ...progress, complete };
  const validated = asValidated(question, answer);
  return {
    complete,
    validated: { ...progress.validated, [question.id]: validated },
  };
}

// Ce qu'on retient d'une question validée : ses options du moment, et sa
// réponse s'il y en a une.
function asValidated(question: Question, answer: Answer | Unanswered) {
  const offered = optionValues(question);
  const given = offeredAnswer(question, answer);
  return {
    ...(offered && { offered }),
    ...(given !== undefined && { answer: given }),
  };
}

function asAsked(question: Question, seen: Seen, earlier: Seen): Question {
  const offered = (options: readonly Option[]) => offeredOptions(options, seen);
  const texts = displayedTexts(question, seen, earlier);
  if (question.kind === "date" || question.kind === "datetime")
    return { ...question, ...texts, ...question.boundsFrom?.(seen) };
  if (question.kind === "address")
    return { ...question, ...texts, abroad: abroadOf(question, seen) };
  if (question.kind === "single choice")
    return { ...question, ...texts, options: offered(question.options) };
  if (question.kind !== "multiple choice") return { ...question, ...texts };
  const { exclusiveOption: exclusive } = question;
  const [exclusiveOption] = offered(exclusive ? [exclusive] : []);
  return {
    ...question,
    ...texts,
    options: offered(question.options),
    exclusiveOption,
  };
}

// Le mode d'une adresse, vu les réponses : à l'étranger, ou en France.
function abroadOf(
  question: Extract<Question, { kind: "address" }>,
  seen: Seen,
): boolean | undefined {
  return question.abroadIf?.(seen) ?? question.abroad;
}

// Ce qui se lit autour du champ, vu les réponses : le libellé, le rappel, et
// les incohérences. Celles-ci ne lisent pas les pages suivantes (`earlier`).
function displayedTexts(question: Question, seen: Seen, earlier: Seen) {
  return {
    label: question.labelFrom?.(seen) ?? question.label,
    reminder: question.reminderFrom?.(seen) ?? question.reminder,
    inconsistencies: question.inconsistenciesFrom?.(earlier),
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

// Les options qui se proposent, vu les réponses, sous leur libellé du moment.
function offeredOptions(options: readonly Option[], seen: Seen): Option[] {
  return options
    .filter((option) => option.offeredIf?.(seen) ?? true)
    .map((option) => ({
      ...option,
      label: option.labelFrom?.(seen) ?? option.label,
      help: option.helpFrom?.(seen) ?? option.help,
    }));
}
