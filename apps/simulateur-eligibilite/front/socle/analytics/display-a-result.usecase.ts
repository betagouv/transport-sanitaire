// Afficher le premier résultat, une fois chargé. Le journal reçoit sa révision,
// et ce que le prescripteur y a vu ; une révision réaffichée n'en reçoit rien.
// Les boutons offerts y sont exposés : leurs clics s'y rattacheront.

import type { Button, Exposures } from "./button-exposure.entity";
import type { Journal } from "./journal.port";
import type { Journey } from "./journey.entity";
import type { ShownResult } from "./revision.entity";

export class DisplayAResult {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  execute(
    journey: Journey,
    shown: ShownResult,
    buttons: readonly Button[],
  ): Exposures {
    const displayed = journey.displayResult(shown);
    const { events, exposures } = journey.exposeButtons(buttons);
    for (const event of [...displayed, ...events])
      void this.#journal.record(event);
    return exposures;
  }
}
