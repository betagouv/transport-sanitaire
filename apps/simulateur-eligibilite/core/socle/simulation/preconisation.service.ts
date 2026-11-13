// La préconisation : les faits de réponses, puis leurs cibles. Seules les
// parties d'avant le verrou la font. Ses faits lisent aussi les questions
// validées : une option qui ne s'est pas proposée n'a pas été refusée.
//
// Un service : la simulation s'en sert à chaque étape et pour verrouiller, les
// use cases sur des réponses données d'un coup.

import type { AnyFaits, CoreModel, Preconisation } from "../model.ts";
import {
  type Answers,
  type AnyCibles,
  type AnyQuestions,
  pagesOf,
  Questionnaire,
  type Reading,
} from "../questionnaire-engine/index.ts";
import { Lock } from "./simulation-stage.vo.ts";

export class PreconisationService<
  Questions extends AnyQuestions = AnyQuestions,
  Faits extends AnyFaits = AnyFaits,
  Cibles extends AnyCibles = AnyCibles,
> {
  readonly #core: CoreModel<Questions, Faits, Cibles>;

  constructor(core: CoreModel<Questions, Faits, Cibles>) {
    this.#core = core;
  }

  /** La préconisation de ces réponses, lues dans les parties d'avant le verrou. */
  ofAnswers(answers: Answers<Questions>): Preconisation<Faits, Cibles> {
    return this.of(this.#before().readWith(answers));
  }

  /** La préconisation d'une lecture déjà faite des parties d'avant le verrou. */
  of(read: Reading<Questions>): Preconisation<Faits, Cibles> {
    const core = this.#core;
    const faits = core.preconisation.faits(
      read.answers,
      read.validated,
      core.relevance,
    );
    return { faits, cibles: core.preconisation.cibles(faits) };
  }

  /**
   * Ce que verrouille cette lecture : les réponses des questions validées, et
   * leur préconisation. Une réponse qu'un retour en arrière a laissée sans
   * objet ne passe pas le verrou : rien de ce qui suit ne la lit.
   */
  lock(reading: Reading<Questions>): Lock {
    const answers = reading.validated.answers();
    return new Lock(answers, this.ofAnswers(answers));
  }

  // Le questionnaire d'avant le verrou.
  #before(): Questionnaire<Questions> {
    const core = this.#core;
    return new Questionnaire<Questions>(
      pagesOf(core.questionnaire),
      core.relevance,
    );
  }
}
