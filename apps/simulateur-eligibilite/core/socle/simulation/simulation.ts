// Une simulation, l'agrégat du parcours : un modèle, les réponses validées, la
// page ouverte et l'étape où l'on en est. Chaque transition (valider la page,
// reculer, rouvrir une réponse à revoir, aller à une position, verrouiller)
// donne une nouvelle simulation ; aucune ne change celle-ci. L'écran n'y ajoute
// que le brouillon de la page ouverte.

import type { AnyFaits, CoreModel, Preconisation } from "../model.ts";
import {
  type Answers,
  type AnyCibles,
  type AskedQuestion,
  type Page,
  pagesOf,
  type Read,
  type Reading,
  readIn,
  type Validated,
  type ValidatedAnswers,
} from "../questionnaire-engine/index.ts";

import {
  keptDraft,
  type Opened,
  openingAt,
  type Refused,
  whereACorrectionResumes,
} from "./correction.ts";
import { type PlaceInPart, placeInPart } from "./place-in-part.ts";
import { type Position, reachedPages, stepOf } from "./position.ts";
import { preconisationFrom } from "./preconisation.ts";
import { resultScope } from "./result-scope.ts";
import {
  endOf,
  type Locked,
  lockOf,
  pendingIn,
  readAt,
  reopenedOf,
  type Stage,
  whereAnswersLead,
} from "./stages.ts";

export type { Locked, Stage };

/** Ce que la trace de debug lit d'une simulation. */
export type SimulationTrace = {
  pages: readonly Page[];
  answers: Answers;
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
   * données aurait sous les yeux, ou le résultat qu'elles atteignent. `on` :
   * le jour du cerfa, si elles y mènent.
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
  readonly stage: Stage;
  readonly #core: CoreModel;
  readonly #reading: Reading;
  readonly #page: Page | undefined;
  readonly #opened: Opened;
  #preconisation?: Preconisation;

  private constructor(
    core: CoreModel,
    stage: Stage,
    answers: Answers,
    reading: Reading,
    page: Page | undefined,
    opened: Opened = {},
  ) {
    this.#core = core;
    this.stage = stage;
    this.answers = answers;
    this.#reading = reading;
    this.#page = page;
    this.#opened = opened;
  }

  // Cette étape, sur la page où un prescripteur ayant donné ces réponses se
  // trouverait : la première qui attend une réponse, sinon la dernière. Une
  // seed rouvre ainsi sur sa page, avec un « Précédent ».
  private static at(core: CoreModel, stage: Stage, answers: Answers) {
    const reading = readAt(core, stage, answers);
    const blank = new Simulation(core, stage, answers, reading, undefined);
    const pages = blank.pages();
    const pending = pages.find(pendingIn(reading, answers));
    return blank.#on(stage, pending ?? pages.at(-1));
  }

  /**
   * La page ouverte ; sur un résultat, celle que « Précédent » rouvre. Une
   * étape qui ne pose aucune page n'en a pas : l'écran n'y monte rien.
   */
  get page(): Page {
    if (!this.#page) throw new Error("Cette étape ne pose aucune page.");
    return this.#page;
  }

  /**
   * Les pages de l'étape qui posent au moins une question, dans l'ordre.
   * Après le verrou, celles du complément : rien d'avant ne se repose.
   */
  pages(): readonly Page[] {
    const asked = this.#reading.askedPages();
    if (!("locked" in this.stage)) return asked;
    return asked.filter((page) => this.#core.complement.pages.includes(page));
  }

  /**
   * Les questions de cette page. `draft`, le brouillon lu par-dessus les
   * réponses validées, peut en révéler une autre sur la même page.
   */
  questionsOn(page: Page, draft?: Answers): readonly AskedQuestion[] {
    if (!draft) return this.#reading.questionsOn(page);
    const shown = { ...this.answers, ...draft };
    return readAt(this.#core, this.stage, shown).questionsOn(page);
  }

  /** La place de la page ouverte dans sa partie (`place-in-part.ts`). */
  get placeInPart(): PlaceInPart {
    return placeInPart(this.#core, this.pages(), this.page);
  }

  /** Toutes les questions qui se posent ont-elles leur réponse ? */
  isComplete(): boolean {
    return this.#reading.isComplete();
  }

  /** Une page de l'étape précède celle-ci : « Précédent » y revient. */
  hasPrevious(): boolean {
    return this.pages().indexOf(this.page) > 0;
  }

  /** Une correction est en cours : « Suivant » ramène vers son origine. */
  get correcting(): boolean {
    return this.#opened.correction !== undefined;
  }

  /** Le brouillon que la page ouverte retrouve : celui d'avant la correction. */
  get restoredDraft(): Answers {
    return this.#opened.draft ?? {};
  }

  /** Le rang de la page ouverte, et pendant une correction celui de son origine. */
  get position(): Position {
    const pages = this.pages();
    const asked = this.#reading.askedPages();
    const step = stepOf(this.stage, asked, pages, this.#page);
    const { correction } = this.#opened;
    return correction ? { step, returnTo: correction.returnTo } : { step };
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
    return readIn(resultScope({ validated, faits, cibles, on }));
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
   * Valide la page ouverte avec ce brouillon (`validate-a-page.ts` dit ce qui
   * s'efface), puis ouvre la page qui suit, ou celle où reprend une correction
   * (`correction.ts`). Sans suivante, l'étape s'achève : le résultat avant le
   * verrou, le cerfa après, daté de `on`.
   */
  validate(draft: Answers, on = new Date()): Simulation {
    const answers = this.#reading.commit(this.page, draft);
    const reading = readAt(this.#core, this.stage, answers);
    const { correction } = this.#opened;
    const following = reading.pageAfter(this.page);
    const declared = pagesOf(this.#core.questionnaire);
    const opening = correction
      ? whereACorrectionResumes(correction, reading, answers, declared)
      : following && { page: following };
    const stage = opening ? this.stage : endOf(this.stage, on);
    const { page = this.page, ...opened } = opening ?? {};
    return new Simulation(this.#core, stage, answers, reading, page, opened);
  }

  /**
   * Reculer ne valide rien : la page qui précède rouvre sur ses réponses
   * validées, et une correction en cours s'abandonne. Sur la première page de
   * l'étape, la même simulation.
   */
  back(): Simulation {
    const pages = this.pages();
    const previous = pages[pages.indexOf(this.page) - 1];
    if (!previous) return this;
    return this.#on(this.stage, previous);
  }

  /**
   * Rouvre la page d'avant qui pose cette question validée, pour la revoir
   * (ADR-30). La page ouverte devient l'origine de la correction, avec ce
   * brouillon ; une correction en cours garde la sienne. Refusée : pas
   * avant le verrou, ou pas une question validée d'une page d'avant.
   */
  revisit(question: string, draft: Answers): Simulation | Refused {
    if (this.stage.name !== "questionnaire") return undefined;
    if (!this.validated.question(question).isValidated()) return undefined;
    const pages = this.pages();
    const target = pages.find((page) =>
      this.questionsOn(page).some(({ id }) => id === question),
    );
    if (!target || pages.indexOf(target) >= pages.indexOf(this.page))
      return undefined;
    const correction = this.#opened.correction ?? {
      origin: this.page,
      draft,
      returnTo: this.position.step,
    };
    return this.#on(this.stage, target, { correction });
  }

  /** Va à cette position, si elle est posée (`openingAt`). */
  moveTo(position: Position): Simulation | Refused {
    if ("locked" in this.stage) return undefined;
    const pending = pendingIn(this.#reading, this.answers);
    const reached = reachedPages(this.pages(), pending);
    const kept = keptDraft(this.#opened, this.#page);
    const opening = openingAt(position, reached, pending, kept);
    if (!opening) return undefined;
    const { page, ...opened } = opening;
    return this.#on({ name: "questionnaire" }, page, opened);
  }

  /**
   * Depuis un résultat, rouvre le questionnaire qui le précède sur la page
   * quittée, réponses intactes. Ailleurs, la même simulation.
   */
  reopen(): Simulation {
    return this.#on(reopenedOf(this.stage), this.#page);
  }

  /**
   * Verrouille : ne garde que les réponses des questions validées, fige leur
   * préconisation, et ouvre le complément sur sa première page.
   */
  lock(): Simulation {
    return Simulation.afterLock(this.#core, lockOf(this.#core, this.#reading));
  }

  // La même lecture, à cette étape et sur cette page.
  #on(stage: Stage, page: Page | undefined, opened: Opened = {}): Simulation {
    const [core, reading] = [this.#core, this.#reading];
    return new Simulation(core, stage, this.answers, reading, page, opened);
  }
}
