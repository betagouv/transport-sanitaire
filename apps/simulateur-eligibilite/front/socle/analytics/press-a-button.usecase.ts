// Cliquer un bouton exposé : imprimer, télécharger, ou donner son avis. Le
// journal reçoit chaque clic, rattaché à l'exposition du bouton cliqué.

import type { ButtonExposure } from "./button-exposure.entity";
import type { Journal } from "./journal.port";
import type { Journey } from "./journey.entity";

export class PressAButton {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  execute(journey: Journey, exposure: ButtonExposure): void {
    for (const event of journey.press(exposure, "requested"))
      void this.#journal.record(event);
  }
}
