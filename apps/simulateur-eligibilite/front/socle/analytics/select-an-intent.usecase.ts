// Signaler au journal ce que le prescripteur est venu faire, une seule fois
// par simulation : son premier choix validé.

import type { Intent } from "../../../core/socle/model.types";
import type { AnalyticsIntent } from "../../../shared/analytics/analytics-event.constants";
import type { Journal } from "./journal.port";
import type { Journey } from "./journey.entity";

export class SelectAnIntent {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  execute(journey: Journey, intent: Intent): void {
    const event = journey.selectIntent(INTENT_IN_THE_JOURNAL[intent]);
    if (event) void this.#journal.record(event);
  }
}

// ---- implémentation ----

const INTENT_IN_THE_JOURNAL: Record<Intent, AnalyticsIntent> = {
  check: "eligibilite_seule",
  prescribe: "eligibilite_et_prescription",
};
