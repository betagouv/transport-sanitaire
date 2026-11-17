// Lancer l'impression ou le téléchargement du document R3 : un geste de l'app,
// après le clic ou après la génération qu'il a relancée. Le journal le reçoit
// avec le document lancé ; il ne compte jamais comme un clic (ANA22-02).

import type { Journal } from "./journal.port";
import type { Journey } from "./journey.entity";
import type { DocumentRequest } from "./revision.entity";

export class LaunchADocument {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  execute(journey: Journey, request: DocumentRequest): void {
    for (const event of journey.requestDocument(request))
      void this.#journal.record(event);
  }
}
