// Un passage dans le questionnaire, tel que la mesure d'audience le compte : son
// début, ses étapes, sa fin, ou son abandon.

import type { RattachementSaisi } from "../../../shared/rattachement-saisi";
import {
  AudienceEvent,
  type AudienceEventName,
  EventName,
  type NothingToCount,
} from "./audience-event.entity";

export type QuestionnaireRunOptions = {
  /** `null` tant que personne ne s'est rattaché. */
  rattachement: RattachementSaisi | null;
  /** Le questionnaire est-il compté ? Le second, celui du cerfa, ne l'est pas. */
  counted: boolean;
  /** Le questionnaire a déjà des réponses : il reprend, il ne commence pas. */
  resumed: boolean;
};

export class QuestionnaireRun {
  readonly #rattachement: RattachementSaisi | null;
  readonly #counted: boolean;
  readonly #resumed: boolean;
  #completed = false;

  constructor({ rattachement, counted, resumed }: QuestionnaireRunOptions) {
    this.#rattachement = rattachement;
    this.#counted = counted;
    this.#resumed = resumed;
  }

  /** Le début, sauf pour un questionnaire qui reprend. */
  start(): AudienceEvent | NothingToCount {
    return this.#resumed ? null : this.#event(EventName.simulationStart);
  }

  /** `page` : le rang de la page qui suit l'étape franchie. */
  pass(page: number): AudienceEvent | NothingToCount {
    return this.#event(EventName.simulationStep, page);
  }

  complete(): AudienceEvent | NothingToCount {
    this.#completed = true;
    return this.#event(EventName.simulationComplete);
  }

  /** L'abandon, sur la page ouverte, sauf pour un questionnaire fini. */
  leave(page: number): AudienceEvent | NothingToCount {
    if (this.#completed) return null;
    return this.#event(EventName.simulationAbandon, page);
  }

  #event(
    name: AudienceEventName,
    value?: number,
  ): AudienceEvent | NothingToCount {
    if (!this.#counted) return null;
    return AudienceEvent.of(name, this.#rattachement, value);
  }
}
