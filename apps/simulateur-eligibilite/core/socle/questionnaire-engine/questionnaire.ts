// Un questionnaire, et ce qu'on y lit. Le questionnaire, ce sont ses pages,
// dans l'ordre. Une lecture, ce sont des réponses lues à travers lui : les
// pages et les questions qui se posent, ce qui en est validé, ce qui attend.
//
// Une lecture ne change pas, et se calcule une seule fois : ses accesseurs ne
// relisent rien. Valider une page donne de nouvelles réponses, qu'on relit.

import { answersOf, GivenAnswers } from "./answers/given-answers.ts";
import { ValidatedAnswers } from "./answers/validated-answers.ts";
import { NOTHING, type Reads, readsOf } from "./conditions/condition.ts";
import { Positions } from "./conditions/what-a-condition-sees.ts";
import {
  type AskedPage,
  readInOrder,
} from "./decide-which-questions-to-ask.ts";
import type { Relevance } from "./does-a-question-still-matter/matters.ts";
import type { AskedQuestion } from "./question/asked/question.ts";
import type {
  Answer,
  Answers,
  AnyCibles,
  AnyQuestions,
  Page,
  Question,
  Unanswered,
  Validated,
} from "./question/question.ts";
import { answerOnPage, commitPage, forget } from "./validate-a-page.ts";

/** Le questionnaire s'achève : aucune page ne suit. */
type Finished = undefined;

/**
 * Un questionnaire : ses pages, dans l'ordre. `Questions` : celles du modèle,
 * pour lire ses réponses typées. Une question à plusieurs places mal déclarée
 * l'arrête dès sa construction (`Positions`).
 */
export class Questionnaire<Questions extends AnyQuestions = AnyQuestions> {
  readonly pages: readonly Page[];
  /** Ce qu'une question change de ce qui compte. Sans elle, tout compte. */
  readonly relevance?: Relevance;
  /** Où se trouve chaque question, à chacune de ses places. */
  readonly positions: Positions;

  constructor(pages: readonly Page[], relevance?: Relevance) {
    this.pages = pages;
    this.positions = new Positions(pages);
    if (relevance) this.relevance = relevance;
  }

  /**
   * Ce que lit sa complétude : ses questions, et ce que lisent leurs gardes,
   * qui décident si chacune se pose.
   */
  get reads(): Reads {
    return this.pages
      .flatMap((page) => page.questions)
      .map(({ id, guardReads }) =>
        readsOf({ ...NOTHING, questions: [id] }, guardReads),
      )
      .reduce(readsOf, NOTHING);
  }

  /**
   * Ces réponses, lues à travers ce questionnaire. `cibles` : celles que le
   * verrou a figées, que lisent les questions d'après lui.
   */
  readWith(
    answers: Answers<Questions> | GivenAnswers<Questions>,
    cibles?: AnyCibles,
  ): Reading<Questions> {
    const given =
      answers instanceof GivenAnswers ? answersOf(answers) : answers;
    return new Reading(this, given, cibles);
  }
}

/**
 * Des réponses lues à travers un questionnaire. Elle se lit par
 * `Questionnaire.readWith`.
 */
export class Reading<Questions extends AnyQuestions = AnyQuestions> {
  /** Les réponses, chacune telle qu'elle est donnée. */
  readonly answers: GivenAnswers<Questions>;
  /** Les questions validées, avec ce qui s'y proposait. */
  readonly validated: ValidatedAnswers<Questions>;
  readonly #questionnaire: Questionnaire<Questions>;
  readonly #cibles: AnyCibles | undefined;
  readonly #asked: readonly AskedPage[];
  readonly #complete: boolean;

  constructor(
    questionnaire: Questionnaire<Questions>,
    answers: Answers<Questions>,
    cibles: AnyCibles | undefined,
  ) {
    const { relevance } = questionnaire;
    const read = readInOrder(questionnaire, answers, { cibles, relevance });
    this.answers = new GivenAnswers(answers);
    this.validated = new ValidatedAnswers(
      read.validated as Validated<Questions>,
    );
    this.#questionnaire = questionnaire;
    this.#cibles = cibles;
    this.#asked = read.asked.filter(({ questions }) => questions.length > 0);
    this.#complete = read.complete;
  }

  /** Les pages qui posent au moins une question, dans l'ordre. */
  askedPages(): readonly Page[] {
    return this.#asked.map(({ page }) => page);
  }

  /**
   * Les questions de cette page qui se posent, telles qu'elles se posent :
   * sous leur libellé du moment, avec les seules options qui se proposent.
   */
  questionsOn(page: Page): readonly AskedQuestion[] {
    return this.#asked.find((read) => read.page === page)?.questions ?? [];
  }

  /** Toutes les questions qui se posent ont-elles leur réponse ? */
  isComplete(): boolean {
    return this.#complete;
  }

  /**
   * La page où un prescripteur ayant donné ces réponses se trouverait : la
   * première qui attend une réponse, sinon la dernière. Une seed rouvre ainsi
   * sur sa page, avec un « Précédent ».
   */
  openPage(): Page {
    const given = answersOf(this.answers);
    const pending = this.#asked.find(({ questions }) =>
      questions.some((question) => !question.isAnsweredBy(given[question.id])),
    );
    const open = pending ?? this.#asked.at(-1);
    if (!open) throw new Error("Ce questionnaire n'affiche aucune page.");
    return open.page;
  }

  /** La page qui suit celle-ci. Aucune : le questionnaire s'achève. */
  pageAfter(page: Page): Page | Finished {
    const pages = this.askedPages();
    return pages[pages.findIndex(({ id }) => id === page.id) + 1];
  }

  /**
   * Les réponses, une fois cette page validée avec ce brouillon. Une question
   * que la page ne pose plus n'y laisse pas de réponse, ni une option qu'elle
   * ne propose plus. Celles qui dépendaient d'une réponse changée sont
   * effacées (`validate-a-page.ts`). Une question à plusieurs places garde la
   * sienne si une place d'avant la pose, ou si une place d'après le peut.
   */
  commit(page: Page, draft: Answers): Answers {
    const given = answersOf(this.answers);
    const shown = this.withDraft(page, draft);
    const inputs = shown.questionsOn(page).flatMap((question) => {
      const answer = question.kept(draft[question.id]);
      return answer === undefined ? [] : [[question.id, answer] as const];
    });
    const { pages } = this.#questionnaire;
    const waiting = shown.#waitingOn(page);
    return commitPage(pages, given, page, Object.fromEntries(inputs), waiting);
  }

  /**
   * Le brouillon de cette page après une saisie (`answerOnPage`). Une question
   * que la page ne pose plus y perd sa réponse, de proche en proche : reposée,
   * elle revient vide (#411). Elle la garde si une autre de ses places la pose,
   * ou le peut encore.
   */
  answerOn(
    page: Page,
    draft: Answers,
    id: string,
    answer: Answer | Unanswered,
  ): Answers {
    return this.#onlyAsked(page, answerOnPage(page, draft, id, answer));
  }

  /**
   * Ces réponses, avec ce brouillon de la page par-dessus. Le brouillon tient
   * lieu des réponses de la page : celle qu'il a perdue ne revient pas des
   * réponses validées. Une question posée d'abord plus tôt garde la sienne.
   */
  withDraft(page: Page, draft: Answers): Reading<Questions> {
    const { pages, positions } = this.#questionnaire;
    const rank = pages.indexOf(page);
    const others = Object.entries(answersOf(this.answers)).filter(
      ([id]) => positions.of(id)?.page !== rank,
    );
    const shown = { ...Object.fromEntries(others), ...draft };
    return this.#questionnaire.readWith(
      shown as Answers<Questions>,
      this.#cibles,
    );
  }

  // ---- implémentation ----

  // Le brouillon, sans les réponses des questions que la page ne pose plus.
  // Oublier une réponse peut en cacher une autre : on relit jusqu'à ce que
  // rien ne change.
  #onlyAsked(page: Page, draft: Answers): Answers {
    const shown = this.withDraft(page, draft);
    const asked = new Set([
      ...shown.questionsOn(page).map(({ id }) => id),
      ...shown.#waitingOn(page),
    ]);
    const hidden = page.questions
      .filter(({ id }) => !asked.has(id))
      .filter((question) => !isBlank(question, draft[question.id]))
      .map(({ id }) => id);
    if (hidden.length === 0) return draft;
    return this.#onlyAsked(page, forget(page, draft, new Set(hidden)));
  }

  // Les questions de la page qui ne s'y posent pas, et gardent leur réponse :
  // une place d'avant les pose, ou une place d'après le peut encore.
  #waitingOn(page: Page): readonly string[] {
    const { pages, positions } = this.#questionnaire;
    const rank = pages.findIndex(({ id }) => id === page.id);
    const shown = new Set(this.questionsOn(page).map(({ id }) => id));
    const before = new Set(
      this.#asked
        .filter((read) => pages.indexOf(read.page) < rank)
        .flatMap((read) => read.questions.map(({ id }) => id)),
    );
    return page.questions
      .map(({ id }) => id)
      .filter((id) => !shown.has(id))
      .filter((id) => before.has(id) || positions.hasPlaceAfter(id, rank));
  }
}

// Sans réponse : rien, ou une case seule décochée.
function isBlank(question: Question, answer: Answer | Unanswered): boolean {
  return answer === undefined || (question.kind === "checkbox" && !answer);
}
