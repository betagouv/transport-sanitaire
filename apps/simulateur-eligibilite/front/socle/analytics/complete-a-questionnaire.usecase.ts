// Finir le questionnaire : sa dernière page est validée.

import type { Audience } from "./audience.port";
import type { QuestionnaireRun } from "./questionnaire-run.entity";

export class CompleteAQuestionnaire {
  readonly #audience: Audience;

  constructor(audience: Audience) {
    this.#audience = audience;
  }

  execute(run: QuestionnaireRun): void {
    const event = run.complete();
    if (event) this.#audience.track(event);
  }
}
