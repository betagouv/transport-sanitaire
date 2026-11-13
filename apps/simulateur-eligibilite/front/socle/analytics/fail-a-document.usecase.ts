// Rater la génération du document R3. Le journal reçoit chaque tentative
// ratée, pour le diagnostic : elle n'ouvre aucune version.

import type { Journal } from "./journal.port";
import type { Journey } from "./journey.entity";

export class FailADocument {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  execute(journey: Journey): void {
    for (const event of journey.failADocument())
      void this.#journal.record(event);
  }
}
