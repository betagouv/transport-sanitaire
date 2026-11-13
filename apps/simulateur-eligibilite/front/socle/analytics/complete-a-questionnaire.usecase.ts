// Finir le questionnaire : sa dernière page est validée. La mesure d'audience
// compte la fin, le journal garde la page validée et la fin de sa phase.

import type { Audience } from "./audience.port";
import type { Journal } from "./journal.port";
import type { Journey, PageValidation } from "./journey.entity";
import type { QuestionnaireRun } from "./questionnaire-run.entity";

export class CompleteAQuestionnaire {
  readonly #audience: Audience;
  readonly #journal: Journal;

  constructor(audience: Audience, journal: Journal) {
    this.#audience = audience;
    this.#journal = journal;
  }

  execute(
    run: QuestionnaireRun,
    journey: Journey,
    validation: PageValidation,
  ): void {
    const counted = run.complete();
    if (counted) this.#audience.track(counted);
    for (const event of journey.validate(validation))
      void this.#journal.record(event);
  }
}
