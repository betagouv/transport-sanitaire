// Démarrer une simulation : ouvrir un parcours, et le signaler au journal sur
// P0. Le parcours garde l'établissement et le service du rattachement, ids et
// noms, et les écrit sur chacun de ses événements (ADR-0053).
//
// La première simulation de la page dit aussi comment la page s'est chargée
// (ADR-0049) : une simulation ouverte sur une page rechargée vient souvent d'une
// autre, perdue. « Faire une nouvelle simulation » ne recharge pas la page :
// les suivantes ne le disent pas.
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
export type Build = Pick<Provenance, "app_version" | "commit_sha">;

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
    const provenance = {
      ...this.#build,
      version,
      ...(rattachement && rattachementDuParcours(rattachement)),
    };
    const journey = new Journey({ seeded, provenance });
    const event = journey.start({
      navigation: this.#first ? this.#pageLoad.navigation() : undefined,
    });
    this.#first = false;
    if (event) void this.#journal.record(event);
    return journey;
  }
}

// ---- implémentation ----

// Ce que le parcours dit de son rattachement : les ids du référentiel, et les
// noms. Un établissement saisi n'a pas d'id. Un nom saisi passe devant celui de
// la liste : sous « Autre », c'est lui qui dit le service.
function rattachementDuParcours(
  saisie: RattachementSaisi,
): RattachementDuParcours {
  return {
    establishment_id: saisie.etabId || undefined,
    service_id: saisie.serviceId,
    establishment_name: nom(saisie.etabLibre) ?? nom(saisie.etabLibelle),
    service_name: nom(saisie.serviceLibre) ?? nom(saisie.serviceLibelle),
  };
}

/** Rien de saisi ni de lu dans la liste : l'événement part sans nom. */
type SansNom = undefined;

function nom(texte: string | undefined): string | SansNom {
  return texte?.trim() || undefined;
}
