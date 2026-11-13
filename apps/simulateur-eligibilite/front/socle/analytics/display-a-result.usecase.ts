// Afficher le premier résultat, une fois chargé. Le journal reçoit sa révision,
// et ce que le prescripteur y a vu ; une révision réaffichée n'en reçoit rien.

import type { Journal } from "./journal.port";
import type { Journey } from "./journey.entity";
import type { ShownResult } from "./revision.entity";

export class DisplayAResult {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  execute(journey: Journey, shown: ShownResult): void {
    for (const event of journey.displayResult(shown))
      void this.#journal.record(event);
  }
}
