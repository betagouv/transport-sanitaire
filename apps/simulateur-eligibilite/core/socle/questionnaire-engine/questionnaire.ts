// Un questionnaire, et ce qu'on y lit. Le questionnaire, ce sont ses pages,
// dans l'ordre. Une lecture, ce sont des réponses lues à travers lui : les
// pages et les questions qui se posent, ce qui en est validé, ce qui attend.
//
// Une lecture ne change pas, et se calcule une seule fois : ses accesseurs ne
// relisent rien. Valider une page donne de nouvelles réponses, qu'on relit.

import { type AskedPage, readInOrder } from "./asked-questions.ts";
import { answersOf, GivenAnswers } from "./given-answers.ts";
import { isAnswered, offeredAnswer } from "./offered-answer.ts";
import { commitPage } from "./page-commit.ts";
import type {
  Answers,
  AnyCibles,
  AnyQuestions,
  Page,
  Question,
  Validated,
} from "./question.ts";
import { ValidatedAnswers } from "./validated-answers.ts";

/**
 * Où en est un questionnaire : ses réponses validées, et la page ouverte. Le
 * parcours le garde d'un écran à l'autre, une seed le reconstruit.
 */
export type QuestionnaireState = {
  readonly answers: Answers;
  readonly page: string;
};

/**
 * Un questionnaire : ses pages, dans l'ordre. `Questions` : celles du modèle,
 * pour lire ses réponses typées.
 */
export class Questionnaire<Questions extends AnyQuestions = AnyQuestions> {
  readonly pages: readonly Page[];

  constructor(pages: readonly Page[]) {
    this.pages = pages;
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
    const read = readInOrder(questionnaire.pages, answers, cibles);
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
  questionsOn(page: Page): readonly Question[] {
    return this.#asked.find((read) => read.page === page)?.questions ?? [];
  }

  /** Toutes les questions qui se posent ont-elles leur réponse ? */
  isComplete(): boolean {
    return this.#complete;
  }

  /**
   * La page où un utilisateur ayant donné ces réponses se trouverait : la
   * première qui attend une réponse, sinon la dernière. Une seed rouvre ainsi
   * sur sa page, avec un « Précédent ».
   */
  openPage(): Page {
    const given = answersOf(this.answers);
    const pending = this.#asked.find(({ questions }) =>
      questions.some((question) => !isAnswered(question, given[question.id])),
    );
    const open = pending ?? this.#asked.at(-1);
    if (!open) throw new Error("Ce questionnaire n'affiche aucune page.");
    return open.page;
  }

  /** La page qui suit celle-ci. Aucune : le questionnaire s'achève. */
  pageAfter(page: Page): Page | undefined {
    const pages = this.askedPages();
    return pages[pages.findIndex(({ id }) => id === page.id) + 1];
  }

  /**
   * Les réponses, une fois cette page validée avec ce brouillon. Une question
   * que la page ne pose plus n'y laisse pas de réponse, ni une option qu'elle
   * ne propose plus. Celles qui dépendaient d'une réponse changée sont
   * effacées (`page-commit.ts`).
   */
  commit(page: Page, draft: Answers): Answers {
    const given = answersOf(this.answers);
    const shown = this.#questionnaire.readWith(
      { ...given, ...draft },
      this.#cibles,
    );
    const inputs = shown.questionsOn(page).flatMap((question) => {
      const answer = offeredAnswer(question, draft[question.id]);
      return answer === undefined ? [] : [[question.id, answer] as const];
    });
    const { pages } = this.#questionnaire;
    return commitPage(pages, given, page, Object.fromEntries(inputs));
  }
}
