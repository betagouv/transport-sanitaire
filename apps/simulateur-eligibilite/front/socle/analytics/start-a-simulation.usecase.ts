// Démarrer une simulation : ouvrir un parcours, et le signaler au journal sur
// P0, avec l'établissement et le service du rattachement.

import type { RattachementSaisi } from "../../../shared/rattachement-saisi";
import type { Journal } from "./journal.port";
import { Journey } from "./journey.entity";

export type SimulationStart = {
  /** `null` tant que personne ne s'est rattaché. */
  rattachement: RattachementSaisi | null;
  /** La simulation s'ouvre sur une seed : son parcours ne part pas. */
  seeded: boolean;
};

export class StartASimulation {
  readonly #journal: Journal;

  constructor(journal: Journal) {
    this.#journal = journal;
  }

  execute({ rattachement, seeded }: SimulationStart): Journey {
    const journey = new Journey({ seeded });
    const event = journey.start({
      // Un établissement saisi n'a pas d'identifiant.
      establishment_id: rattachement?.etabId || undefined,
      service_id: rattachement?.serviceId,
    });
    if (event) void this.#journal.record(event);
    return journey;
  }
}
