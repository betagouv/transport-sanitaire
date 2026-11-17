// Afficher le premier résultat, une fois chargé. Le journal reçoit sa révision,
// et ce que le prescripteur y a vu ; une révision réaffichée n'en reçoit rien.
// Les boutons offerts y sont exposés : leurs clics s'y rattacheront.

import type { Button } from "./button-place.vo";
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
  ): void {
    const displayed = journey.displayResult(shown);
    const exposed = journey.exposeButtons(buttons);
    for (const event of [...displayed, ...exposed])
      void this.#journal.record(event);
  }
}
