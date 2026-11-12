// Le conteneur du serveur : il instancie les classes une fois, au démarrage,
// et les relie entre elles. C'est le seul endroit qui choisit un adaptateur.
//
// Rien ne s'y crée au chargement du module : `server.ts` l'appelle avec la
// configuration, les tests avec leurs propres adaptateurs.

import {
  type Referentiel,
  snapshotReferentiel,
} from "../shared/referentiel.ts";
import type { Configuration } from "./configuration.ts";
import { GristApiClient } from "./grist/grist-api.client.ts";
import { CollectAnEvent } from "./journal/collect-an-event.usecase.ts";
import { GristJournal } from "./journal/grist-journal.adapter.ts";
import { JournalController } from "./journal/journal.controller.ts";
import type { Journal } from "./journal/journal.port.ts";
import { MemoryJournal } from "./journal/memory-journal.adapter.ts";
import { creerReferentielGrist } from "./rattachement/referentiel-grist.ts";

/** Ce que le serveur attend de l'extérieur : ses adaptateurs, et où il tourne. */
export type Adapters = {
  referentiel: Referentiel;
  journal: Journal;
  /** L'environnement écrit avec chaque événement : production, staging… */
  environment: string;
};

export type Container = {
  referentiel: Referentiel;
  journalController: JournalController;
};

/**
 * Les adaptateurs que la configuration désigne : Grist quand la clé est posée,
 * sinon le référentiel snapshot et le journal en mémoire.
 */
export function adaptersFor({
  grist,
  journal,
  environment,
}: Configuration): Adapters {
  return {
    referentiel: grist
      ? creerReferentielGrist(new GristApiClient(grist))
      : snapshotReferentiel,
    journal: journal
      ? new GristJournal(new GristApiClient(journal))
      : new MemoryJournal(),
    environment,
  };
}

export function createContainer({
  referentiel,
  journal,
  environment,
}: Adapters): Container {
  const collectAnEvent = new CollectAnEvent(journal, environment);
  return {
    referentiel,
    journalController: new JournalController(collectAnEvent),
  };
}
