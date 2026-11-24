// Fermer une simulation : le dire au journal, à la suite de ses événements,
// avant que la suivante s'ouvre. Seule « Faire une nouvelle simulation » la
// ferme pour l'instant ; l'inactivité n'est pas encore détectée.

import type { ClosureReason } from "../../../shared/analytics/analytics-event";
import type { Journal } from "./journal.port";
import type { Journey } from "./journey.entity";

export class CloseASimulation {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  execute(journey: Journey, reason: ClosureReason): void {
    const event = journey.close(reason);
    if (event) void this.#journal.record(event);
  }
}
