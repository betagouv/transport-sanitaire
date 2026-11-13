// Quitter le questionnaire : l'onglet se ferme.

import type { Audience } from "./audience.port";
import type { QuestionnaireRun } from "./questionnaire-run.entity";

export class LeaveAQuestionnaire {
  readonly #audience: Audience;

  constructor(audience: Audience) {
    this.#audience = audience;
  }

  /** `page` : le rang de la page ouverte au départ. */
  execute(run: QuestionnaireRun, page: number): void {
    const event = run.leave(page);
    if (event) this.#audience.track(event);
  }
}
