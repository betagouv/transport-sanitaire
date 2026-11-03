// Une simulation : des réponses, lues dans le questionnaire d'un modèle, et ce
// que la préconisation en calcule. Avant le verrou, elle lit les parties qui
// mènent au premier résultat et calcule leur préconisation. Après, elle lit
// toutes les pages, sous la préconisation que le verrou a figé.

import type { AnyFaits, CoreModel, Preconisation } from "../model.ts";
import {
  type Read,
  readIn,
} from "../questionnaire-engine/conditions/condition.ts";
import {
  type Answers,
  type AnyCibles,
  type AnyQuestions,
  type Page,
  pagesOf,
  type Validated,
} from "../questionnaire-engine/question/question.ts";
import {
  Questionnaire,
  type Reading,
} from "../questionnaire-engine/questionnaire.ts";
import { resultReading } from "./result-reading.ts";

/** Ce que le verrou fige : les réponses d'avant, et leur préconisation. */
export type Locked = { answers: Answers; preconisation: Preconisation };

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
  /** Avant le verrou : ces réponses, dans les parties qui mènent au premier résultat. */
  static of(core: CoreModel, answers: Answers): Simulation {
    const questionnaire = new Questionnaire(
      pagesOf(core.questionnaire),
      core.relevance,
    );
    const reading = questionnaire.readWith(answers);
    const preconisation = preconisationOf(core, answers);
    return new Simulation(core, answers, reading, preconisation);
  }

  /**
   * Après le verrou : ces réponses, dans toutes les pages, sous la
   * préconisation figée. Les questions d'après le verrou lisent ses cibles.
   */
  static afterLock(
    core: CoreModel,
    locked: Locked,
    answers: Answers,
  ): Simulation {
    const questionnaire = new Questionnaire(
      [...pagesOf(core.questionnaire), ...core.complement.pages],
      core.relevance,
    );
    const reading = questionnaire.readWith(
      answers,
      locked.preconisation.cibles,
    );
    return new Simulation(core, answers, reading, locked.preconisation);
  }

  /** Les réponses données, telles quelles. */
  readonly answers: Answers;
  /** Ce que le questionnaire pose et retient de ces réponses. */
  readonly reading: Reading;
  readonly preconisation: Preconisation;
  readonly #core: CoreModel;

  private constructor(
    core: CoreModel,
    answers: Answers,
    reading: Reading,
    preconisation: Preconisation,
  ) {
    this.#core = core;
    this.answers = answers;
    this.reading = reading;
    this.preconisation = preconisation;
  }

  /**
   * Ce qu'un résultat lit, au jour `on` : les questions validées, les faits
   * et les cibles de la préconisation.
   */
  read(on: Date): Read {
    const { faits, cibles } = this.preconisation;
    const { validated } = this.reading;
    return readIn(resultReading({ validated, faits, cibles, on }));
  }

  /**
   * Verrouille ces réponses : n'en garde que celles des questions validées, et
   * leur préconisation. Une réponse qu'un retour en arrière a laissée sans objet
   * ne passe pas le verrou : rien de ce qui suit ne la lit.
   */
  lock(): Locked {
    const acquired = this.reading.validated.answers();
    return {
      answers: acquired,
      preconisation: preconisationOf(this.#core, acquired),
    };
  }

  /** Les pages affichées, les réponses, les questions validées, la préconisation. */
  trace(): SimulationTrace {
    return {
      pages: this.reading.askedPages(),
      answers: this.answers,
      validated: this.reading.validated.toJSON(),
      ...this.preconisation,
    };
  }
}

/**
 * La préconisation de ces réponses : leurs faits, puis leurs cibles. Seules les
 * parties d'avant le verrou la font.
 */
export function preconisationOf<
  Questions extends AnyQuestions,
  Faits extends AnyFaits,
  Cibles extends AnyCibles,
>(
  model: CoreModel<Questions, Faits, Cibles>,
  answers: Answers<Questions>,
): Preconisation<Faits, Cibles> {
  const { relevance } = model;
  const questionnaire = new Questionnaire<Questions>(
    pagesOf(model.questionnaire),
    relevance,
  );
  const read = questionnaire.readWith(answers);
  const faits = model.preconisation.faits(
    read.answers,
    read.validated,
    relevance,
  );
  return { faits, cibles: model.preconisation.cibles(faits) };
}
