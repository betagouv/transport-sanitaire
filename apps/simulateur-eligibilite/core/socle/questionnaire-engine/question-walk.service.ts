// Le parcours des pages, dans l'ordre : les questions qui se posent, telles
// qu'elles se posent (`question/asked/question.vo.ts`), et ce qui en est
// validé, avec ce qui s'y proposait (`walk-progress.vo.ts`).
//
// Les questions se lisent dans l'ordre. Chacune voit celles qui la précèdent
// et qui sont validées : ses conditions peuvent en dépendre, pas de la suite.
// Ses incohérences ne voient pas non plus les réponses des pages suivantes.
//
// Seules les pages posées après le verrou reçoivent les cibles figées. Les
// autres lisent celles que le modèle calcule sur leurs faits
// (`question/asked/context.vo.ts`), même relues après le verrou.
//
// Avec une pertinence, une question dont la réponse ne change rien de ce qui
// compte ne se pose pas (`does-a-question-still-matter/relevance.service.ts`, #255) :
// elle n'est jamais validée.
//
// Une question à plusieurs places se pose à la première où ses gardes tiennent
// et qui compte (ADR-29). Une place suivante ne la pose pas si elle s'est déjà
// posée plus tôt, validée ou en attente.

import { GivenAnswers } from "./answers/given-answers.vo.ts";
import { ValidatedAnswers } from "./answers/validated-answers.vo.ts";
import { GuardPlace } from "./conditions/guard-place.vo.ts";
import type { QuestionPositions } from "./conditions/question-positions.vo.ts";
import type { Relevance } from "./does-a-question-still-matter/relevance.service.ts";
import type { SeenAnswers } from "./question/asked/context.vo.ts";
import type { AskedQuestion } from "./question/asked/question.vo.ts";
import type {
  Answers,
  AnyCibles,
  NotAsked,
  Page,
  Question,
} from "./question/question.types.ts";
import { WalkProgress } from "./walk-progress.vo.ts";

/** Une page lue : ses questions qui se posent, telles qu'elles se posent. */
export type AskedPage = {
  readonly page: Page;
  readonly questions: readonly AskedQuestion[];
};

/** Ce qui se pose page par page, et où en est le parcours à la fin. */
type Walk = {
  readonly asked: readonly AskedPage[];
  readonly progress: WalkProgress;
};

/**
 * Parcourt les pages d'un questionnaire. `cibles` : celles que le verrou a
 * figées. `relevance` : ce qu'une question change de ce qui compte.
 */
export class QuestionWalkService {
  readonly #pages: readonly Page[];
  readonly #positions: QuestionPositions;
  readonly #cibles?: AnyCibles;
  readonly #relevance?: Relevance;

  constructor(
    questionnaire: { pages: readonly Page[]; positions: QuestionPositions },
    { cibles, relevance }: { cibles?: AnyCibles; relevance?: Relevance } = {},
  ) {
    this.#pages = questionnaire.pages;
    this.#positions = questionnaire.positions;
    this.#cibles = cibles;
    this.#relevance = relevance;
  }

  /**
   * Ces réponses lues page par page, question par question. Dès qu'une
   * question attend sa réponse, plus rien n'est validé : ce qui la suit se
   * pose encore, mais ne compte pas.
   */
  walk(answers: Answers): Walk {
    let progress = WalkProgress.start();
    const asked: AskedPage[] = [];
    for (const [rank, page] of this.#pages.entries()) {
      const context = this.#contextOf(page, rank, answers);
      const read = askPage(page, context, progress);
      asked.push({ page, questions: read.questions });
      progress = read.progress;
    }
    return { asked, progress };
  }

  // ---- implémentation ----

  #contextOf(page: Page, rank: number, answers: Answers): Context {
    return {
      answers,
      earlier: answersUpTo(this.#positions, rank, answers),
      cibles: page.afterLock ? this.#cibles : undefined,
      positions: this.#positions,
      rank,
      relevance: this.#relevance,
    };
  }
}

// Ce que les questions d'une page peuvent lire : les réponses, celles qu'en
// voient leurs incohérences (sans les pages suivantes), et les cibles.
// `positions` et `rank` : où se trouvent les questions, et la page lue.
type Context = {
  readonly answers: Answers;
  readonly earlier: Answers;
  readonly cibles?: AnyCibles;
  readonly positions: QuestionPositions;
  readonly rank: number;
  readonly relevance?: Relevance;
};

// Les questions de la page qui se posent, dans l'ordre. Chacune voit ce que les
// précédentes ont validé, et celles de la page posées avant elle. Ses gardes
// se décident si les pages d'avant n'attendent rien.
function askPage(page: Page, context: Context, start: WalkProgress) {
  const decided = start.complete;
  let progress = start;
  const questions: AskedQuestion[] = [];
  for (const [index, declared] of page.questions.entries()) {
    if (declared.isLaterPlace && progress.askedBefore(declared.id)) continue;
    const place = new GuardPlace({
      id: declared.id,
      at: { page: context.rank, index },
      positions: context.positions,
      onPage: new Map(questions.map((asked) => [asked.id, asked])),
      validated: progress.validated,
      answers: context.answers,
    });
    const question = askQuestion(declared, context, place);
    if (!question || !matters(declared, context, progress)) {
      const ruledOut = decided && !question;
      progress = progress.notAsked(declared.id, { ruledOut });
      continue;
    }
    questions.push(question);
    progress = progress.asked(question, context.answers[question.id]);
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
    answer: place.reading({ own }),
  });
  return declared.askedIn(seenWith(answers, false), seenWith(earlier, true));
}

// Sans pertinence, toute question qui se pose compte. Elle compte à sa place.
function matters(
  declared: Question,
  { relevance, cibles }: Context,
  { validated, pending }: WalkProgress,
): boolean {
  return relevance?.matters(declared, { validated, pending, cibles }) ?? true;
}

// Les réponses, sans celles des questions dont la première place suit cette
// page. Les réponses acquises avant le verrou n'ont pas de page ici : elles
// restent.
function answersUpTo(
  positions: QuestionPositions,
  rank: number,
  answers: Answers,
): Answers {
  return Object.fromEntries(
    Object.entries(answers).filter(
      ([id]) => (positions.of(id)?.page ?? rank) <= rank,
    ),
  );
}
