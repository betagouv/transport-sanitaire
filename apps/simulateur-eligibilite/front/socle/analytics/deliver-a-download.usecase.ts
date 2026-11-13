// Remettre au navigateur le PDF qu'un clic sur « Télécharger » a demandé. Le
// journal reçoit la réussite, avec l'exposition de la demande.

import type { ButtonExposure } from "./button-exposure.entity";
import type { Journal } from "./journal.port";
import type { Journey } from "./journey.entity";

export class DeliverADownload {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  execute(journey: Journey, exposure: ButtonExposure): void {
    for (const event of journey.press(exposure, "succeeded"))
      void this.#journal.record(event);
  }
}
