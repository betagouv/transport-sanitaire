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

import { isAnswered, offeredAnswer, optionValues } from "./offered-answer";
import type { Option } from "./option";
import type {
  Answer,
  Answers,
  AnyCibles,
  Page,
  Question,
  Unanswered,
  Validated,
} from "./question";

/**
 * Les questions de la page qui se posent, vu les réponses et les cibles, telles
 * qu'elles se posent : sous leur libellé du moment, avec les seules options
 * qui se proposent. `pages` : le questionnaire où la page se trouve.
 */
export function askedQuestions(
  pages: readonly Page[],
  page: Page,
  answers: Answers,
  cibles?: AnyCibles,
): readonly Question[] {
  const { asked } = inOrder(pages, answers, cibles);
  return asked.find((read) => read.page === page)?.questions ?? [];
}

/** Les pages qui posent au moins une question, dans l'ordre du questionnaire. */
export function askedPages(
  pages: readonly Page[],
  answers: Answers,
  cibles?: AnyCibles,
) {
  return inOrder(pages, answers, cibles)
    .asked.filter(({ questions }) => questions.length > 0)
    .map(({ page }) => page);
}

/**
 * Les questions validées de ces pages : chaque question qui se pose, dans
 * l'ordre, jusqu'à la première qui attend sa réponse. Une question facultative
 * restée sans réponse y figure : elle a été posée.
 */
export function validatedQuestions(
  pages: readonly Page[],
  answers: Answers,
  cibles?: AnyCibles,
): Validated {
  return inOrder(pages, answers, cibles).validated;
}

/** Toutes les questions qui se posent dans ces pages ont-elles leur réponse ? */
export function areAnswered(
  pages: readonly Page[],
  answers: Answers,
  cibles?: AnyCibles,
): boolean {
  return inOrder(pages, answers, cibles).complete;
}

// ---- implémentation ----

// Ce qu'une condition lit : les réponses, les cibles figées s'il y en a, et
// les questions validées avant celle qu'elle concerne.
type Seen = readonly [Answers, AnyCibles | undefined, Validated];

type AskedPage = { page: Page; questions: Question[] };

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

// Les pages lues dans l'ordre, question par question. Dès qu'une question
// attend sa réponse, plus rien n'est validé : ce qui la suit se pose encore,
// mais ne compte pas.
function inOrder(pages: readonly Page[], answers: Answers, cibles?: AnyCibles) {
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
  const seen: Seen = [answers, cibles, validated];
  if (!(declared.askedIf?.(...seen) ?? true)) return undefined;
  return asAsked(declared, seen, [earlier, cibles, validated]);
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
    return { ...question, ...texts, ...question.boundsFrom?.(...seen) };
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
  return question.abroadIf?.(...seen) ?? question.abroad;
}

// Ce qui se lit autour du champ, vu les réponses : le libellé, le rappel, et
// les incohérences. Celles-ci ne lisent pas les pages suivantes (`earlier`).
function displayedTexts(question: Question, seen: Seen, earlier: Seen) {
  const asked = question.labelFrom?.(...seen) ?? question.label;
  return {
    label: question.optional ? `${asked} (facultatif)` : asked,
    reminder: question.reminderFrom?.(...seen) ?? question.reminder,
    inconsistencies: question.inconsistenciesFrom?.(...earlier),
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
    .filter((option) => option.offeredIf?.(...seen) ?? true)
    .map((option) => ({
      ...option,
      label: option.labelFrom?.(...seen) ?? option.label,
      help: option.helpFrom?.(...seen) ?? option.help,
    }));
}
