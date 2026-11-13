// Franchir une étape du questionnaire : la mesure d'audience la compte, le
// journal garde la page validée.

import type { Audience } from "./audience.port";
import type { Journal } from "./journal.port";
import type { Journey, PageValidation } from "./journey.entity";
import type { QuestionnaireRun } from "./questionnaire-run.entity";

export type Step = {
  /** Le rang de la page qui suit l'étape franchie. */
  page: number;
  validation: PageValidation;
};

export class PassAStep {
  readonly #audience: Audience;
  readonly #journal: Journal;

  constructor(audience: Audience, journal: Journal) {
    this.#audience = audience;
    this.#journal = journal;
  }

  execute(run: QuestionnaireRun, journey: Journey, step: Step): void {
    const counted = run.pass(step.page);
    if (counted) this.#audience.track(counted);
    for (const event of journey.validate(step.validation))
      void this.#journal.record(event);
  }
}
