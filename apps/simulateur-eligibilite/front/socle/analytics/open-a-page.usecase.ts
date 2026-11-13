// Ouvrir une page du questionnaire : un affichage de plus, l'entrée dans sa
// phase la première fois, et ses questions exposées.

import type { Journal } from "./journal.port";
import type { Journey } from "./journey.entity";
import type { OpenedPage } from "./page-view.entity";

export class OpenAPage {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  execute(journey: Journey, page: OpenedPage): void {
    for (const event of journey.openAPage(page))
      void this.#journal.record(event);
  }
}
