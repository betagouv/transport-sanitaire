// Ce que la simulation demande au moteur du questionnaire : lire des réponses à
// une étape, savoir où elles mènent. Un service : il fait le pont entre la
// simulation et le moteur.

import type { CoreModel } from "../model.types.ts";
import {
  type AnsweredQuestionnaire,
  type Answers,
  pagesOf,
  Questionnaire,
} from "../questionnaire-engine/index.ts";
import type { PreconisationService } from "./preconisation.service.ts";
import { SimulationStage } from "./simulation-stage.vo.ts";

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
  at(stage: SimulationStage, answers: Answers): AnsweredQuestionnaire {
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
}
