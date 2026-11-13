// Afficher le document R3, son PDF prêt. Le journal reçoit sa version ; une
// version réaffichée n'en reçoit rien.

import type { DocumentContent } from "./document-version.entity";
import type { Journal } from "./journal.port";
import type { Journey } from "./journey.entity";

export class DisplayADocument {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  execute(journey: Journey, content: DocumentContent): void {
    for (const event of journey.displayDocument(content))
      void this.#journal.record(event);
  }
}
