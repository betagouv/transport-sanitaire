// Démarrer une simulation : ouvrir un parcours, et le signaler au journal sur
// P0. Le parcours garde les ids de l'établissement et du service du
// rattachement, et les écrit sur chacun de ses événements (ADR-0053).
//
// Chaque événement dit quelle app l'a produit (ADR-0050) : la version des règles
// du modèle ouvert, et le build, sa version et son commit.

import type {
  Provenance,
  RattachementDuParcours,
} from "../../../shared/analytics/analytics-event";
import type { RattachementSaisi } from "../../../shared/rattachement-saisi";
import type { Journal } from "./journal.port";
import { Journey } from "./journey.entity";

export type SimulationStart = {
  /** `null` tant que personne ne s'est rattaché. */
  rattachement: RattachementSaisi | null;
  /** La simulation s'ouvre sur une seed : son parcours ne part pas. */
  seeded: boolean;
  /** La version des règles du modèle ouvert. */
  version: string;
};

/** L'app construite : sa version et son commit, figés au build. */
export type Build = Pick<Provenance, "app_version" | "commit_sha">;

export class StartASimulation {
  readonly #journal: Journal;
  readonly #build: Build;

  constructor(journal: Journal, build: Build) {
    this.#journal = journal;
    this.#build = build;
  }

  execute({ rattachement, seeded, version }: SimulationStart): Journey {
    const provenance = {
      ...this.#build,
      version,
      ...(rattachement && rattachementDuParcours(rattachement)),
    };
    const journey = new Journey({ seeded, provenance });
    const event = journey.start();
    if (event) void this.#journal.record(event);
    return journey;
  }
}

// ---- implémentation ----

// Ce que le parcours dit de son rattachement : les ids du référentiel. Un
// établissement saisi n'en a pas.
function rattachementDuParcours(
  saisie: RattachementSaisi,
): RattachementDuParcours {
  return {
    establishment_id: saisie.etabId || undefined,
    service_id: saisie.serviceId,
  };
}
