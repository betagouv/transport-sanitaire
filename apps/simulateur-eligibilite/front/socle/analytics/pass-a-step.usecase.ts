// Franchir une étape du questionnaire.

import type { Audience } from "./audience.port";
import type { QuestionnaireRun } from "./questionnaire-run.entity";

export class PassAStep {
  readonly #audience: Audience;

  constructor(audience: Audience) {
    this.#audience = audience;
  }

  /** `page` : le rang de la page qui suit l'étape franchie. */
  execute(run: QuestionnaireRun, page: number): void {
    const event = run.pass(page);
    if (event) this.#audience.track(event);
  }
}
