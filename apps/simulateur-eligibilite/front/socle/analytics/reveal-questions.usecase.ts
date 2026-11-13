// Une saisie change les questions de la page : celles qui apparaissent sont
// exposées dans le même affichage.

import type { Journal } from "./journal.port";
import type { Journey } from "./journey.entity";

export class RevealQuestions {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  /** `questions` : toutes les questions affichées, dans l'ordre. */
  execute(journey: Journey, questions: readonly string[]): void {
    for (const event of journey.showQuestions(questions))
      void this.#journal.record(event);
  }
}
