// Commencer un questionnaire : ouvrir son passage, et compter son début.

import type { Audience } from "./audience.port";
import {
  QuestionnaireRun,
  type QuestionnaireRunOptions,
} from "./questionnaire-run.entity";

export class StartAQuestionnaire {
  readonly #audience: Audience;

  constructor(audience: Audience) {
    this.#audience = audience;
  }

  execute(options: QuestionnaireRunOptions): QuestionnaireRun {
    const run = new QuestionnaireRun(options);
    const event = run.start();
    if (event) this.#audience.track(event);
    return run;
  }
}
