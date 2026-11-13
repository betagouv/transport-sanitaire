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
  readonly #inapplicable: ReadonlySet<string>;

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
    this.#inapplicable = read.inapplicable;
  }

  /**
   * Les questions devenues inapplicables : leurs gardes ne tiennent plus, à
   * toutes leurs places (`decide-which-questions-to-ask.ts`).
   */
  get inapplicable(): ReadonlySet<string> {
    return this.#inapplicable;
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
   * devenue inapplicable n'y laisse pas de réponse, sur cette page comme sur
   * les autres (#411), ni une option que sa question ne propose plus. Celles
   * qui dépendaient d'une réponse changée sont effacées (`validate-a-page.ts`).
   * Une question à plusieurs places garde la sienne si une place d'avant la
   * pose, ou si une place d'après le peut ; une question que le graphe masque
   * garde la sienne.
   */
  commit(page: Page, draft: Answers): Answers {
    const given = answersOf(this.answers);
    const shown = this.withDraft(page, draft);
    const waiting = shown.#waitingOn(page);
    const inputs = Object.fromEntries(shown.#inputsOn(page, draft, waiting));
    const { pages } = this.#questionnaire;
    const committed = commitPage(pages, given, page, inputs, waiting);
    const read = this.#questionnaire.readWith(
      committed as Answers<Questions>,
      this.#cibles,
    );
    return read.#applicable();
  }

  /**
   * Le brouillon de cette page après une saisie (`answerOnPage`). Une question
   * devenue inapplicable y perd sa réponse : reposée, elle revient vide
   * (#411). Elle la garde si une autre de ses places la pose, ou le peut
   * encore, et si le graphe seul la masque.
   */
  answerOn(
    page: Page,
    draft: Answers,
    id: string,
    answer: Answer | Unanswered,
  ): Answers {
    return this.#onlyApplicable(page, answerOnPage(page, draft, id, answer));
  }

  /**
   * Ce brouillon de la page, gardé de côté, relu sur ces réponses : sans les
   * réponses des questions devenues inapplicables, ni les options qui ne se
   * proposent plus (#411). Ce qui tient toujours reste.
   */
  restore(page: Page, draft: Answers): Answers {
    const applicable = this.#onlyApplicable(page, draft);
    const asked = this.withDraft(page, applicable).questionsOn(page);
    const restored = Object.fromEntries(
      Object.entries(applicable).flatMap(([id, answer]) => {
        const question = asked.find((candidate) => candidate.id === id);
        const kept = question ? question.kept(answer) : answer;
        return kept === undefined ? [] : [[id, kept]];
      }),
    );
    // Une option retirée peut exclure une autre question de la page.
    const same = JSON.stringify(restored) === JSON.stringify(draft);
    return same ? draft : this.restore(page, restored);
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

  // Le brouillon, sans les réponses des questions devenues inapplicables. Les
  // gardes ne lisent pas une question qui ne se pose pas : oublier sa réponse
  // n'en exclut aucune autre.
  #onlyApplicable(page: Page, draft: Answers): Answers {
    const { inapplicable } = this.withDraft(page, draft);
    const hidden = page.questions
      .filter(({ id }) => inapplicable.has(id))
      .filter((question) => !isBlank(question, draft[question.id]))
      .map(({ id }) => id);
    if (hidden.length === 0) return draft;
    return forget(page, draft, new Set(hidden));
  }

  // Ce que la page enregistre du brouillon : la réponse de chaque question
  // posée, aux options qu'elle propose, et telle quelle celle d'une question
  // que le graphe masque. Une question qui attend une autre place n'y est pas.
  #inputsOn(page: Page, draft: Answers, waiting: readonly string[]) {
    const asked = this.questionsOn(page);
    return page.questions
      .filter(({ id }) => !this.#inapplicable.has(id) && !waiting.includes(id))
      .flatMap(({ id }) => {
        const question = asked.find((candidate) => candidate.id === id);
        const answer = question ? question.kept(draft[id]) : draft[id];
        return answer === undefined ? [] : [[id, answer] as const];
      });
  }

  // Les réponses, sans celles des questions devenues inapplicables.
  #applicable(): Answers {
    return Object.fromEntries(
      Object.entries(answersOf(this.answers)).filter(
        ([id]) => !this.#inapplicable.has(id),
      ),
    );
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
