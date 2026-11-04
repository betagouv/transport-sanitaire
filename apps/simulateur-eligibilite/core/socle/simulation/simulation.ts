// Une simulation, l'agrégat du parcours : un modèle, les réponses validées, la
// page ouverte et l'étape où l'on en est. Chaque transition (valider la page,
// reculer, rouvrir, verrouiller) donne une nouvelle simulation ; aucune ne
// change celle-ci. L'écran n'y ajoute que le brouillon de la page ouverte.

import type { AnyFaits, CoreModel, Preconisation } from "../model.ts";
import type { ValidatedAnswers } from "../questionnaire-engine/answers/validated-answers.ts";
import {
  type Read,
  readIn,
} from "../questionnaire-engine/conditions/condition.ts";
import type { AskedQuestion } from "../questionnaire-engine/question/asked/question.ts";
import {
  type Answers,
  type AnyCibles,
  type Page,
  pagesOf,
  type Validated,
} from "../questionnaire-engine/question/question.ts";
import {
  Questionnaire,
  type Reading,
} from "../questionnaire-engine/questionnaire.ts";
import { preconisationFrom } from "./preconisation.ts";
import { resultScope } from "./result-scope.ts";

/** Ce que le verrou fige : les réponses d'avant, et leur préconisation. */
export type Locked = { answers: Answers; preconisation: Preconisation };

/**
 * Où en est une simulation : avant le verrou, le questionnaire puis son
 * résultat ; après, le complément puis le cerfa. Le verrou est une étape, pas
 * un drapeau : après lui, l'étape porte ce qu'il a figé.
 */
export type Stage =
  | { name: "questionnaire" }
  | { name: "resultat" }
  | { name: "complement"; locked: Locked }
  | {
      name: "cerfa";
      locked: Locked;
      /** Le jour où le complément a été validé : figé tant qu'il ne l'est pas à nouveau. */
      completedAt: Date;
    };

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
  #preconisation?: Preconisation;

  private constructor(
    core: CoreModel,
    stage: Stage,
    answers: Answers,
    reading: Reading,
    page: Page | undefined,
  ) {
    this.#core = core;
    this.stage = stage;
    this.answers = answers;
    this.#reading = reading;
    this.#page = page;
  }

  // Cette étape, sur la page où un prescripteur ayant donné ces réponses se
  // trouverait : la première qui attend une réponse, sinon la dernière. Une
  // seed rouvre ainsi sur sa page, avec un « Précédent ».
  private static at(core: CoreModel, stage: Stage, answers: Answers) {
    const reading = readAt(core, stage, answers);
    const blank = new Simulation(core, stage, answers, reading, undefined);
    const pages = blank.pages();
    const pending = pages.find((page) =>
      reading
        .questionsOn(page)
        .some((question) => !question.isAnsweredBy(answers[question.id])),
    );
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
   * s'efface), puis ouvre la page qui suit. Sans suivante, l'étape s'achève :
   * le résultat avant le verrou, le cerfa après, daté de `on`.
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
  #on(stage: Stage, page: Page | undefined): Simulation {
    return new Simulation(this.#core, stage, this.answers, this.#reading, page);
  }
}

// ---- implémentation ----

// Ces réponses, lues à cette étape. Avant le verrou : les parties qui mènent
// au premier résultat. Après : toutes les pages, sous les cibles que le verrou
// a figées ; les questions d'après le verrou les lisent.
function readAt(core: CoreModel, stage: Stage, answers: Answers): Reading {
  const before = pagesOf(core.questionnaire);
  if (!("locked" in stage)) {
    return new Questionnaire(before, core.relevance).readWith(answers);
  }
  return new Questionnaire(
    [...before, ...core.complement.pages],
    core.relevance,
  ).readWith(answers, stage.locked.preconisation.cibles);
}

// Ce que verrouille cette lecture : les réponses des questions validées, et
// leur préconisation. Une réponse qu'un retour en arrière a laissée sans
// objet ne passe pas le verrou : rien de ce qui suit ne la lit.
function lockOf(core: CoreModel, reading: Reading): Locked {
  const answers = reading.validated.answers();
  const before = new Questionnaire(pagesOf(core.questionnaire), core.relevance);
  return {
    answers,
    preconisation: preconisationFrom(core, before.readWith(answers)),
  };
}

// L'étape qui s'ouvre quand la page validée n'a pas de suivante.
function endOf(stage: Stage, on: Date): Stage {
  if (stage.name === "questionnaire") return { name: "resultat" };
  if (stage.name === "complement") {
    return { name: "cerfa", locked: stage.locked, completedAt: on };
  }
  return stage;
}

// L'étape que « Précédent » rouvre depuis un résultat : celle qui le précède.
function reopenedOf(stage: Stage): Stage {
  if (stage.name === "resultat") return { name: "questionnaire" };
  if (stage.name === "cerfa")
    return { name: "complement", locked: stage.locked };
  return stage;
}

// L'étape où ces réponses mènent : le résultat qu'elles atteignent, ou le
// questionnaire qu'elles laissent incomplet. Répondre à une question d'après
// le verrou, c'est l'avoir franchi : le cerfa, ou le complément.
function whereAnswersLead(core: CoreModel, answers: Answers, on: Date): Stage {
  const after = core.complement.pages.flatMap((page) =>
    page.questions.map(({ id }) => id),
  );
  const pastLock = Object.keys(answers).some((id) => after.includes(id));
  if (!pastLock) {
    const reading = readAt(core, { name: "questionnaire" }, answers);
    return { name: reading.isComplete() ? "resultat" : "questionnaire" };
  }
  const before = Object.fromEntries(
    Object.entries(answers).filter(([id]) => !after.includes(id)),
  );
  const locked = lockOf(core, readAt(core, { name: "questionnaire" }, before));
  const complement: Stage = { name: "complement", locked };
  return readAt(core, complement, answers).isComplete()
    ? endOf(complement, on)
    : complement;
}
