// Signaler au journal ce que le prescripteur est venu faire, une seule fois
// par simulation : son premier choix validé.

import type { AnalyticsIntent } from "../../../shared/analytics/analytics-event";
import type { Journal } from "./journal.port";
import type { Journey } from "./journey.entity";

/** L'intention que le modèle déclare : vérifier, ou aller jusqu'au document. */
export type ModelIntent = "check" | "prescribe";

export class SelectAnIntent {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  execute(journey: Journey, intent: ModelIntent): void {
    const event = journey.selectIntent(INTENT_IN_THE_JOURNAL[intent]);
    if (event) void this.#journal.record(event);
  }
}

// ---- implémentation ----

const INTENT_IN_THE_JOURNAL: Record<ModelIntent, AnalyticsIntent> = {
  check: "eligibilite_seule",
  prescribe: "eligibilite_et_prescription",
};
