// Remettre au navigateur le PDF du document R3 dont l'app a lancé le
// téléchargement. Le journal reçoit la réussite, avec le document remis.

import type { Journal } from "./journal.port";
import type { Journey } from "./journey.entity";

export class DeliverADownload {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  execute(journey: Journey): void {
    for (const event of journey.deliverDocument())
      void this.#journal.record(event);
  }
}
