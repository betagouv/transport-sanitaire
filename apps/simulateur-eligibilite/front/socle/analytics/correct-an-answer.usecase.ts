// Valider une page rouverte pour corriger une réponse. Ce n'est pas une étape de
// plus : la mesure d'audience n'en compte rien, le journal garde la validation
// et celles qu'elle fait tomber.

import type { Journal } from "./journal.port";
import type { Journey, PageValidation } from "./journey.entity";

export class CorrectAnAnswer {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  execute(journey: Journey, validation: PageValidation): void {
    for (const event of journey.validate(validation))
      void this.#journal.record(event);
  }
}
