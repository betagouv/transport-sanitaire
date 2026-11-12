// Démarrer une simulation : ouvrir un parcours, et le signaler au journal sur
// P0, avec l'établissement et le service du rattachement.

import type { RattachementSaisi } from "../../../shared/rattachement-saisi";
import type { Journal } from "./journal.port";
import { Journey } from "./journey.entity";

export class StartASimulation {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  /** `rattachement` : `null` tant que personne ne s'est rattaché. */
  execute(rattachement: RattachementSaisi | null): Journey {
    const journey = new Journey();
    void this.#journal.record(
      journey.next({
        type: "simulation_started",
        screen: "P0",
        // Un établissement saisi n'a pas d'identifiant.
        establishment_id: rattachement?.etabId || undefined,
        service_id: rattachement?.serviceId,
      }),
    );
    return journey;
  }
}
