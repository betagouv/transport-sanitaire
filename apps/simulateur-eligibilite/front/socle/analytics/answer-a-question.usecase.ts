// Répondre à une question de la page, dans le brouillon : la saisie est
// signalée quand elle change de question.

import type { Journal } from "./journal.port";
import type { Journey } from "./journey.entity";

export class AnswerAQuestion {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  execute(journey: Journey, question: string): void {
    for (const event of journey.interact(question))
      void this.#journal.record(event);
  }
}
