// Ce que la simulation demande au moteur du questionnaire : lire des réponses à
// une étape, savoir où elles mènent, lire un résultat. Un service : il fait le
// pont entre la simulation et le moteur.

import type { CoreModel } from "../model.ts";
import {
  type Answers,
  LocalDateTime,
  pagesOf,
  Questionnaire,
  type Reading,
  type Scope,
  type ValidatedAnswers,
  validatedReading,
} from "../questionnaire-engine/index.ts";
import type { PreconisationService } from "./preconisation.service.ts";
import { SimulationStage } from "./simulation-stage.vo.ts";

/** Ce qu'un résultat sait : ses réponses, sa préconisation, son jour. */
export type ResultSources = {
  readonly validated: ValidatedAnswers;
  readonly faits: unknown;
  readonly cibles: unknown;
  /** L'instant du résultat : sa date de complétion, ou maintenant. */
  readonly on: Date;
};

export class QuestionnaireReadingService {
  readonly #core: CoreModel;
  readonly #preconisation: PreconisationService;

  constructor(core: CoreModel, preconisation: PreconisationService) {
    this.#core = core;
    this.#preconisation = preconisation;
  }

  /**
   * Ces réponses, lues à cette étape. Avant le verrou : les parties qui mènent
   * au premier résultat. Après : toutes les pages, sous les cibles que le
   * verrou a figées ; les questions d'après le verrou les lisent.
   */
  at(stage: SimulationStage, answers: Answers): Reading {
    const core = this.#core;
    const before = pagesOf(core.questionnaire);
    if (!stage.isLocked()) {
      return new Questionnaire(before, core.relevance).readWith(answers);
    }
    return new Questionnaire(
      [...before, ...core.complement.pages],
      core.relevance,
    ).readWith(answers, stage.locked.preconisation.cibles);
  }

  /**
   * L'étape où ces réponses mènent : le résultat qu'elles atteignent, ou le
   * questionnaire qu'elles laissent incomplet. Répondre à une question d'après
   * le verrou, c'est l'avoir franchi : le cerfa, daté de `on`, ou le
   * complément.
   */
  whereAnswersLead(answers: Answers, on: Date): SimulationStage {
    const after = this.#core.complement.pages.flatMap((page) =>
      page.questions.map(({ id }) => id),
    );
    const questionnaire = SimulationStage.questionnaire();
    const pastLock = Object.keys(answers).some((id) => after.includes(id));
    if (!pastLock) {
      const complete = this.at(questionnaire, answers).isComplete();
      return complete ? SimulationStage.resultat() : questionnaire;
    }
    const before = Object.fromEntries(
      Object.entries(answers).filter(([id]) => !after.includes(id)),
    );
    const lock = this.#preconisation.lock(this.at(questionnaire, before));
    const complement = SimulationStage.complement(lock);
    return this.at(complement, answers).isComplete()
      ? complement.next(on)
      : complement;
  }

  /**
   * La lecture d'un résultat, R2 ou R3 : une condition s'y lit comme dans un
   * fait (`given.ts`). Il lit ses cibles telles qu'elles sont : rien ne s'y
   * suppose.
   */
  static ofResult({ validated, faits, cibles, on }: ResultSources): Scope {
    const named = (values: unknown, nom: string): unknown =>
      (values as Readonly<Record<string, unknown>>)[nom];
    return {
      answer: validatedReading(validated),
      fait: (nom) => named(faits, nom),
      cible: (nom) => named(cibles, nom),
      cibleAssuming: (nom) => {
        throw new Error(
          `Un résultat ne suppose rien : il lit ${nom} telle quelle.`,
        );
      },
      today: () => LocalDateTime.dayInParis(on),
    };
  }
}
