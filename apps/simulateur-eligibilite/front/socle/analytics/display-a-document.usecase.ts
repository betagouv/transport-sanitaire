// Afficher le document R3, son PDF prêt. Le journal reçoit sa version ; une
// version réaffichée n'en reçoit rien. Les boutons offerts y sont exposés :
// leurs clics s'y rattacheront.

import type { Button, Exposures } from "./button-exposure.entity";
import type { DocumentContent } from "./document-version.entity";
import type { Journal } from "./journal.port";
import type { Journey } from "./journey.entity";

export class DisplayADocument {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  execute(
    journey: Journey,
    content: DocumentContent,
    buttons: readonly Button[],
  ): Exposures {
    const displayed = journey.displayDocument(content);
    const { events, exposures } = journey.exposeButtons(buttons);
    for (const event of [...displayed, ...events])
      void this.#journal.record(event);
    return exposures;
  }
}
