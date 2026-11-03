// Une simulation, l'agrégat du parcours : un modèle, les réponses validées, la
// page ouverte et l'étape où l'on en est (`stage.ts`). Chaque transition
// (valider la page, reculer, rouvrir, verrouiller) donne une nouvelle
// simulation ; aucune ne change celle-ci. L'écran n'y ajoute que le brouillon
// de la page ouverte.

import type { AnyFaits, CoreModel, Preconisation } from "../model.ts";
import type { ValidatedAnswers } from "../questionnaire-engine/answers/validated-answers.ts";
import {
  type Read,
  readIn,
} from "../questionnaire-engine/conditions/condition.ts";
import type { AskedQuestion } from "../questionnaire-engine/question/asked/question.ts";
import type {
  Answers,
  AnyCibles,
  Page,
  Validated,
} from "../questionnaire-engine/question/question.ts";
import type { Reading } from "../questionnaire-engine/questionnaire.ts";
import { preconisationFrom } from "./preconisation.ts";
import { resultReading } from "./result-reading.ts";
import {
  endOf,
  type Locked,
  lockOf,
  openPageAt,
  pagesAt,
  readAt,
  reopenedOf,
  type Stage,
  whereAnswersLead,
} from "./stage.ts";

/** Ce que la trace de debug lit d'une simulation. */
export type SimulationTrace = {
  /** Les pages affichées, dans l'ordre. */
  pages: readonly Page[];
  answers: Answers;
  /** Les questions validées, avec ce qui s'y proposait. */
  validated: Validated;
  faits: AnyFaits;
  cibles: AnyCibles;
};

export class Simulation {
  /** Aucune réponse : la première page du questionnaire. */
  static start(core: CoreModel): Simulation {
    return Simulation.at(core, { name: "questionnaire" }, {});
  }

  /**
   * Ces réponses, là où elles mènent : la page qu'un prescripteur les ayant
   * données aurait sous les yeux, ou le résultat qu'elles atteignent
   * (`whereAnswersLead`). `on` : le jour du cerfa, si elles y mènent.
   */
  static resume(
    core: CoreModel,
    answers: Answers,
    on = new Date(),
  ): Simulation {
    return Simulation.at(core, whereAnswersLead(core, answers, on), answers);
  }

  /** Le complément qu'ouvre ce verrou, sur sa première page. */
  static afterLock(core: CoreModel, locked: Locked): Simulation {
    return Simulation.at(core, { name: "complement", locked }, locked.answers);
  }

  /** Les réponses validées, telles qu'elles sont données. */
  readonly answers: Answers;
  /** La page ouverte ; sur un résultat, celle que « Précédent » rouvre. */
  readonly page: Page;
  readonly stage: Stage;
  readonly #core: CoreModel;
  readonly #reading: Reading;
  #preconisation?: Preconisation;

  private constructor(
    core: CoreModel,
    stage: Stage,
    answers: Answers,
    reading: Reading,
    page: Page,
  ) {
    this.#core = core;
    this.stage = stage;
    this.answers = answers;
    this.#reading = reading;
    this.page = page;
  }

  // Cette étape, sur la page où ces réponses laissent.
  private static at(core: CoreModel, stage: Stage, answers: Answers) {
    const reading = readAt(core, stage, answers);
    const page = openPageAt(core, stage, reading, answers);
    return new Simulation(core, stage, answers, reading, page);
  }

  /** Les pages de l'étape qui posent au moins une question, dans l'ordre. */
  pages(): readonly Page[] {
    return pagesAt(this.#core, this.stage, this.#reading);
  }

  /**
   * Les questions de cette page, telles qu'elles se posent. `draft` : le
   * brouillon de la page, lu par-dessus les réponses validées ; une question
   * peut ainsi en révéler une autre sur la même page.
   */
  questionsOn(page: Page, draft?: Answers): readonly AskedQuestion[] {
    if (!draft) return this.#reading.questionsOn(page);
    const shown = { ...this.answers, ...draft };
    return readAt(this.#core, this.stage, shown).questionsOn(page);
  }

  /** Toutes les questions qui se posent ont-elles leur réponse ? */
  isComplete(): boolean {
    return this.#reading.isComplete();
  }

  /** Une page de l'étape précède celle-ci : « Précédent » y revient. */
  hasPrevious(): boolean {
    return this.pages().indexOf(this.page) > 0;
  }

  /** Les questions validées, avec ce qui s'y proposait. */
  get validated(): ValidatedAnswers {
    return this.#reading.validated;
  }

  /** Avant le verrou, celle de ces réponses. Après, celle qu'il a figée. */
  get preconisation(): Preconisation {
    if ("locked" in this.stage) return this.stage.locked.preconisation;
    this.#preconisation ??= preconisationFrom(this.#core, this.#reading);
    return this.#preconisation;
  }

  /**
   * Ce qu'un résultat lit, au jour `on` : les questions validées, les faits
   * et les cibles de la préconisation.
   */
  read(on: Date): Read {
    const { faits, cibles } = this.preconisation;
    const { validated } = this.#reading;
    return readIn(resultReading({ validated, faits, cibles, on }));
  }

  /** Les pages affichées, les réponses, les questions validées, la préconisation. */
  trace(): SimulationTrace {
    return {
      pages: this.#reading.askedPages(),
      answers: this.answers,
      validated: this.#reading.validated.toJSON(),
      ...this.preconisation,
    };
  }

  /**
   * Valide la page ouverte avec ce brouillon : n'en garde que ce que la page
   * pose encore, efface ce qui dépendait d'une réponse changée
   * (`validate-a-page.ts`), puis ouvre la page qui suit. Sans suivante,
   * l'étape s'achève : le résultat avant le verrou, le cerfa après, daté de
   * `on`.
   */
  validate(draft: Answers, on = new Date()): Simulation {
    const answers = this.#reading.commit(this.page, draft);
    const reading = readAt(this.#core, this.stage, answers);
    const following = reading.pageAfter(this.page);
    const stage = following ? this.stage : endOf(this.stage, on);
    const page = following ?? this.page;
    return new Simulation(this.#core, stage, answers, reading, page);
  }

  /**
   * Reculer ne valide rien : la page qui précède rouvre sur ses réponses
   * validées. Sur la première page de l'étape, la même simulation.
   */
  back(): Simulation {
    const pages = this.pages();
    const previous = pages[pages.indexOf(this.page) - 1];
    if (!previous) return this;
    return this.#on(this.stage, previous);
  }

  /**
   * Depuis un résultat, rouvre le questionnaire qui le précède sur la page
   * quittée, réponses intactes. Ailleurs, la même simulation.
   */
  reopen(): Simulation {
    return this.#on(reopenedOf(this.stage), this.page);
  }

  /**
   * Verrouille : ne garde que les réponses des questions validées, fige leur
   * préconisation, et ouvre le complément sur sa première page.
   */
  lock(): Simulation {
    return Simulation.afterLock(this.#core, lockOf(this.#core, this.#reading));
  }

  // La même lecture, à cette étape et sur cette page.
  #on(stage: Stage, page: Page): Simulation {
    return new Simulation(this.#core, stage, this.answers, this.#reading, page);
  }
}
