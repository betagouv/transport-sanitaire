// Démarrer une simulation : ouvrir un parcours, et le signaler au journal sur
// P0. Le parcours garde les ids de l'établissement et du service du
// rattachement, et les écrit sur chacun de ses événements (ADR-0053).
//
// Chaque événement dit quelle app l'a produit (ADR-0050) : la version des règles
// du modèle ouvert, et celle du build. Le commit déployé, le serveur l'écrit à
// la réception.

import type {
  Provenance,
  RattachementDuParcours,
} from "../../../shared/analytics/analytics-event";
import type { RattachementDuReferentiel } from "../../../shared/rattachement-du-referentiel.vo";
import type { Journal } from "./journal.port";
import { Journey } from "./journey.entity";

export type SimulationStart = {
  /** `null` tant que personne ne s'est rattaché. */
  rattachement: RattachementDuReferentiel | null;
  /** La simulation s'ouvre sur une seed : son parcours ne part pas. */
  seeded: boolean;
  /** La version des règles du modèle ouvert. */
  modelVersion: string;
};

/** L'app construite : sa version, figée au build. */
export type Build = Pick<Provenance, "app_version">;

export class StartASimulation {
  readonly #journal: Journal;
  readonly #build: Build;

  constructor(journal: Journal, build: Build) {
    this.#journal = journal;
    this.#build = build;
  }

  execute({ rattachement, seeded, modelVersion }: SimulationStart): Journey {
    const provenance = {
      ...this.#build,
      model_version: modelVersion,
      ...(rattachement && rattachementDuParcours(rattachement)),
    };
    const journey = new Journey({ seeded, provenance });
    const event = journey.start();
    if (event) void this.#journal.record(event);
    return journey;
  }
}

// ---- implémentation ----

// Ce que le parcours dit de son rattachement : les ids du référentiel qu'il a,
// et aucun autre champ.
function rattachementDuParcours({
  etabId,
  serviceId,
}: RattachementDuReferentiel): RattachementDuParcours {
  return {
    ...(etabId && { establishment_id: etabId }),
    ...(serviceId && { service_id: serviceId }),
  };
}
