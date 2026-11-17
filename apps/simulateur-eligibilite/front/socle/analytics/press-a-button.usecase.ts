// Cliquer un bouton exposé : imprimer, télécharger, ou donner son avis. Le
// journal reçoit chaque clic, rattaché à l'exposition courante du bouton ; un
// bouton qui n'est pas exposé là n'envoie rien.

import type { Button } from "./button-place.vo";
import type { Journal } from "./journal.port";
import type { Journey } from "./journey.entity";

export class PressAButton {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  execute(journey: Journey, button: Button): void {
    for (const event of journey.click(button)) void this.#journal.record(event);
  }
}
