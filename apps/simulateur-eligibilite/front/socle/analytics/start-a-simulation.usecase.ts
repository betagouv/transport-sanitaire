// Démarrer une simulation : ouvrir un parcours, et le signaler au journal sur
// P0, avec l'établissement et le service du rattachement.
//
// La première simulation de la page dit aussi comment la page s'est chargée
// (ADR-13) : une simulation ouverte sur une page rechargée vient souvent d'une
// autre, perdue. « Faire une nouvelle simulation » ne recharge pas la page :
// les suivantes ne le disent pas.
//
// Chaque événement dit quelle app l'a produit (ADR-14) : la version des règles
// du modèle ouvert, et le build, sa version et son commit.

import type { Provenance } from "../../../shared/analytics/analytics-event";
import type { RattachementSaisi } from "../../../shared/rattachement-saisi";
import type { Journal } from "./journal.port";
import { Journey } from "./journey.entity";
import type { PageLoad } from "./page-load.port";

export type SimulationStart = {
  /** `null` tant que personne ne s'est rattaché. */
  rattachement: RattachementSaisi | null;
  /** La simulation s'ouvre sur une seed : son parcours ne part pas. */
  seeded: boolean;
  /** La version des règles du modèle ouvert. */
  version: string;
};

/** L'app construite : sa version et son commit, figés au build. */
export type Build = Omit<Provenance, "version">;

export class StartASimulation {
  readonly #journal: Journal;
  readonly #pageLoad: PageLoad;
  readonly #build: Build;
  #first = true;

  constructor(journal: Journal, pageLoad: PageLoad, build: Build) {
    this.#journal = journal;
    this.#pageLoad = pageLoad;
    this.#build = build;
  }

  execute({ rattachement, seeded, version }: SimulationStart): Journey {
    const provenance = { ...this.#build, version };
    const journey = new Journey({ seeded, provenance });
    const event = journey.start({
      // Un établissement saisi n'a pas d'identifiant.
      establishment_id: rattachement?.etabId || undefined,
      service_id: rattachement?.serviceId,
      navigation: this.#first ? this.#pageLoad.navigation() : undefined,
    });
    this.#first = false;
    if (event) void this.#journal.record(event);
    return journey;
  }
}
