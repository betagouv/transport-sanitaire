// Une simulation, l'agrégat du parcours : un modèle, les réponses validées, la
// page ouverte et l'étape où l'on en est. Chaque transition (valider la page,
// reculer, rouvrir une réponse à revoir, aller à une position, verrouiller)
// donne une nouvelle simulation ; aucune ne change celle-ci. L'écran n'y ajoute
// que le brouillon de la page ouverte.

import type { CoreModel } from "../model.ts";
import {
  type Answer,
  type Answers,
  type AskedQuestion,
  type Page,
  pagesOf,
  type Read,
  type Reading,
  readIn,
  type ValidatedAnswers,
} from "../questionnaire-engine/index.ts";
import { AnswerCorrection } from "./answer-correction.vo.ts";
import { JourneyPosition, type Refused } from "./journey-position.vo.ts";
import { PageOpening, type StageEnds } from "./page-opening.vo.ts";
import { PagePlaceInPart } from "./page-place-in-part.vo.ts";
import { PageRefusal } from "./page-refusal.error.ts";
import { PreconisationService } from "./preconisation.service.ts";
import type { Preconisation } from "./preconisation.vo.ts";
import { QuestionnaireReadingService } from "./questionnaire-reading.service.ts";
import { type Lock, SimulationStage } from "./simulation-stage.vo.ts";
import { StagePages } from "./stage-pages.vo.ts";

export class Simulation {
  /** Aucune réponse : la première page du questionnaire. */
  static start(core: CoreModel): Simulation {
    return Simulation.#at(core, SimulationStage.questionnaire(), {});
  }

  /**
   * Ces réponses, là où elles mènent : la page qu'un prescripteur les ayant
   * données aurait sous les yeux, ou le résultat qu'elles atteignent. `on` :
   * le jour du cerfa, si elles y mènent.
   */
  static resume(core: CoreModel, answers: Answers, on = new Date()) {
    const preconisation = new PreconisationService(core);
    const reading = new QuestionnaireReadingService(core, preconisation);
    return Simulation.#at(core, reading.whereAnswersLead(answers, on), answers);
  }

  /** Le complément qu'ouvre ce verrou, sur sa première page. */
  static afterLock(core: CoreModel, lock: Lock): Simulation {
    const complement = SimulationStage.complement(lock);
    return Simulation.#at(core, complement, lock.answers);
  }

  /** Les réponses validées, telles qu'elles sont données. */
  readonly answers: Answers;
  readonly stage: SimulationStage;
  readonly #core: CoreModel;
  readonly #readingService: QuestionnaireReadingService;
  readonly #preconisationService: PreconisationService;
  readonly #reading: Reading;
  readonly #opening: PageOpening | undefined;
  #preconisation?: Preconisation;

  // Sans `reading`, la simulation lit ces réponses à cette étape.
  private constructor(
    core: CoreModel,
    stage: SimulationStage,
    answers: Answers,
    opening?: PageOpening,
    reading?: Reading,
  ) {
    const preconisation = new PreconisationService(core);
    this.#core = core;
    this.#preconisationService = preconisation;
    this.#readingService = new QuestionnaireReadingService(core, preconisation);
    this.stage = stage;
    this.answers = answers;
    this.#reading = reading ?? this.#readingService.at(stage, answers);
    this.#opening = opening;
  }

  /**
   * La page ouverte ; sur un résultat, celle que « Précédent » rouvre. Une
   * étape qui ne pose aucune page n'en a pas : l'écran n'y monte rien.
   */
  get page(): Page {
    if (!this.#opening) throw new Error("Cette étape ne pose aucune page.");
    return this.#opening.page;
  }

  /**
   * Les pages de l'étape qui posent au moins une question, dans l'ordre.
   * Après le verrou, celles du complément : rien d'avant ne se repose.
   */
  pages(): readonly Page[] {
    return this.#stagePages().list;
  }

  /** Les questions de cette page, avec ce brouillon par-dessus ses réponses. */
  questionsOn(page: Page, draft?: Answers): readonly AskedQuestion[] {
    const shown = draft ? this.#reading.withDraft(page, draft) : this.#reading;
    return shown.questionsOn(page);
  }

  /** Le brouillon de la page ouverte après cette saisie (`Reading.answerOn`). */
  answerOnPage(draft: Answers, id: string, answer?: Answer): Answers {
    return this.#reading.answerOn(this.page, draft, id, answer);
  }

  /** La place de la page ouverte dans sa partie. */
  get placeInPart(): PagePlaceInPart {
    return PagePlaceInPart.of(this.#core, this.pages(), this.page);
  }

  /** Toutes les questions qui se posent ont-elles leur réponse ? */
  isComplete(): boolean {
    return this.#reading.isComplete();
  }

  /** Une page de l'étape précède celle-ci : « Précédent » y revient. */
  hasPrevious(): boolean {
    return this.#stagePages().before(this.page) !== undefined;
  }

  /** Une correction est en cours : « Suivant » ramène vers son origine. */
  get correcting(): boolean {
    return this.#opening?.correction !== undefined;
  }

  /** Le brouillon que la page ouverte retrouve : celui d'avant la correction. */
  get restoredDraft(): Answers {
    return this.#opening?.draft ?? {};
  }

  /** Le rang de la page ouverte, et pendant une correction celui de son origine. */
  get position(): JourneyPosition {
    return JourneyPosition.of(
      this.stage,
      this.#reading.askedPages(),
      this.pages(),
      this.#opening?.page,
      this.#opening?.correction?.returnTo,
    );
  }

  /** Les questions validées, avec ce qui s'y proposait. */
  get validated(): ValidatedAnswers {
    return this.#reading.validated;
  }

  /** Avant le verrou, celle de ces réponses. Après, celle qu'il a figée. */
  get preconisation(): Preconisation {
    if (this.stage.isLocked()) return this.stage.locked.preconisation;
    this.#preconisation ??= this.#preconisationService.of(this.#reading);
    return this.#preconisation;
  }

  /**
   * Ce qu'un résultat lit, au jour `on` : les questions validées, les faits
   * et les cibles de la préconisation.
   */
  read(on: Date): Read {
    const { faits, cibles } = this.preconisation;
    const { validated } = this.#reading;
    const sources = { validated, faits, cibles, on };
    return readIn(QuestionnaireReadingService.ofResult(sources));
  }

  /** Les pages affichées, les réponses, les questions validées, la préconisation. */
  trace() {
    return {
      pages: this.#reading.askedPages(),
      answers: this.answers,
      validated: this.#reading.validated.toJSON(),
      ...this.preconisation,
    };
  }

  /**
   * Valide la page ouverte avec ce brouillon (`validate-a-page.ts`), puis ouvre
   * la suivante, ou celle où reprend une correction. Sans suivante : le
   * résultat avant le verrou, le cerfa daté de `on` après.
   */
  validate(draft: Answers, on = new Date()): Simulation {
    PageRefusal.unlessAnswered(this.#reading, this.page, draft);
    return this.#advance(draft, on);
  }

  /** Valider ce brouillon achèverait-il l'étape ? Sans vérifier la page. */
  endsWith(draft: Answers): boolean {
    return this.#advance(draft, new Date()).stage.name !== this.stage.name;
  }

  /**
   * Reculer ne valide rien : la page qui précède rouvre sur ses réponses
   * validées, et une correction en cours s'abandonne. Sur la première page de
   * l'étape, la même simulation.
   */
  back(): Simulation {
    const previous = this.#stagePages().before(this.page);
    if (!previous) return this;
    return this.#on(this.stage, new PageOpening(previous));
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
    const correction =
      this.#opening?.correction ??
      new AnswerCorrection(this.page, draft, this.position.step);
    return this.#on(this.stage, new PageOpening(target, correction));
  }

  /** Va à cette position, si elle est posée (`JourneyPosition.openingIn`). */
  moveTo(position: JourneyPosition): Simulation | Refused {
    if (this.stage.isLocked()) return undefined;
    const kept = this.#opening?.keptDraft();
    const opening = position.openingIn(this.#stagePages(), kept);
    if (!opening) return undefined;
    return this.#on(SimulationStage.questionnaire(), opening);
  }

  /**
   * Depuis un résultat, rouvre le questionnaire qui le précède sur la page
   * quittée, réponses intactes. Ailleurs, la même simulation.
   */
  reopen(): Simulation {
    const page = this.#opening?.page;
    return this.#on(this.stage.previous(), page && new PageOpening(page));
  }

  /**
   * Verrouille : ne garde que les réponses des questions validées, fige leur
   * préconisation, et ouvre le complément sur sa première page.
   */
  lock(): Simulation {
    const lock = this.#preconisationService.lock(this.#reading);
    return Simulation.afterLock(this.#core, lock);
  }

  // ---- implémentation ----

  // Cette étape, sur la page où un prescripteur ayant donné ces réponses se
  // trouverait : la première qui attend une réponse, sinon la dernière. Une
  // seed rouvre ainsi sur sa page, avec un « Précédent ».
  static #at(core: CoreModel, stage: SimulationStage, answers: Answers) {
    const blank = new Simulation(core, stage, answers);
    const page = blank.#stagePages().current();
    return blank.#on(stage, page && new PageOpening(page));
  }

  // Les pages de l'étape, et celles qui attendent une réponse.
  #stagePages(): StagePages {
    const { complement } = this.#core;
    const within = this.stage.isLocked() ? complement.pages : undefined;
    return StagePages.of(this.#reading, this.answers, within);
  }

  #advance(draft: Answers, on: Date): Simulation {
    const answers = this.#reading.commit(this.page, draft);
    const reading = this.#readingService.at(this.stage, answers);
    const opening = this.#openingAfter(reading, answers);
    const stage = opening ? this.stage : this.stage.next(on);
    const opened = opening ?? new PageOpening(this.page);
    return new Simulation(this.#core, stage, answers, opened, reading);
  }

  // La page qu'ouvre la validation de la page ouverte, sur ces réponses
  // relues : celle où reprend une correction en cours, sinon la suivante.
  // Aucune : l'étape s'achève.
  #openingAfter(reading: Reading, answers: Answers): PageOpening | StageEnds {
    const correction = this.#opening?.correction;
    if (correction) {
      const declared = pagesOf(this.#core.questionnaire);
      const pages = StagePages.of(reading, answers);
      return correction.resumeOn(pages, reading, declared);
    }
    const following = reading.pageAfter(this.page);
    return following && new PageOpening(following);
  }

  // La même lecture, à cette étape et sur cette page.
  #on(stage: SimulationStage, opening: PageOpening | undefined): Simulation {
    const [core, reading] = [this.#core, this.#reading];
    return new Simulation(core, stage, this.answers, opening, reading);
  }
}
