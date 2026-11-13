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
import { DiscardingJournal } from "./journal/discarding-journal.adapter.ts";
import { GristJournal } from "./journal/grist-journal.adapter.ts";
import { JournalController } from "./journal/journal.controller.ts";
import type { Journal } from "./journal/journal.port.ts";
import type { Build } from "./journal/journal-entry.entity.ts";
import { ReportAlive } from "./journal/report-alive.usecase.ts";
import { creerReferentielGrist } from "./rattachement/referentiel-grist.ts";

/** Ce que le serveur attend de l'extérieur : ses adaptateurs, et où il tourne. */
export type Adapters = {
  referentiel: Referentiel;
  journal: Journal;
  /** L'environnement écrit avec chaque événement : production, staging… */
  environment: string;
  /** L'app servie, sur le signe de vie du journal. */
  build: Build;
};

export type Container = {
  referentiel: Referentiel;
  journalController: JournalController;
  /** Le signe de vie de la collecte, que `server.ts` écrit chaque heure. */
  reportAlive: ReportAlive;
};

/**
 * Les adaptateurs que la configuration désigne : Grist quand la clé et le doc
 * sont posés, sinon le référentiel snapshot et un journal qui ne garde rien.
 */
export function adaptersFor({
  grist,
  journal,
  environment,
  build,
}: Configuration): Adapters {
  return {
    referentiel: grist
      ? creerReferentielGrist(new GristApiClient(grist))
      : snapshotReferentiel,
    journal: journal
      ? new GristJournal(new GristApiClient(journal))
      : new DiscardingJournal(),
    environment,
    build,
  };
}

export function createContainer({
  referentiel,
  journal,
  environment,
  build,
}: Adapters): Container {
  const collectAnEvent = new CollectAnEvent(journal, environment);
  return {
    referentiel,
    journalController: new JournalController(collectAnEvent),
    reportAlive: new ReportAlive(journal, build, environment),
  };
}
