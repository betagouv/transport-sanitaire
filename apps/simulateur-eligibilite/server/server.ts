// Point d'entrée du serveur : il sert le front et l'API. La configuration est
// lue par `configuration.ts`.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { creerApp } from "./app.ts";
import { type Configuration, lireConfiguration } from "./configuration.ts";
import { GristApiClient } from "./grist/grist-api.client.ts";
import { GristJournal } from "./journal/grist-journal.adapter.ts";
import type { Journal } from "./journal/journal.port.ts";
import { MemoryJournal } from "./journal/memory-journal.adapter.ts";
import { choisirReferentiel } from "./rattachement/referentiel-source.ts";

const configuration = configurationOuArret();

const app = creerApp(choisirReferentiel(configuration.grist), {
  journal: journalOf(configuration),
  environment: configuration.environment,
  dossierDist: dossierDist(),
});

app.listen(configuration.port, () => {
  console.log(`[simulateur] à l'écoute sur le port ${configuration.port}`);
});

// ---- implémentation ----

// Une variable manquante en production est une erreur d'exploitation. On sort
// sur le message, sans trace de pile, avec un code non nul : la plateforme voit
// l'échec du déploiement.
function configurationOuArret(): Configuration {
  try {
    return lireConfiguration();
  } catch (erreur) {
    console.error(`[simulateur] ${(erreur as Error).message}`);
    process.exit(1);
  }
}

// Grist si l'accès est configuré, sinon la mémoire.
function journalOf({ journal }: Configuration): Journal {
  return journal
    ? new GristJournal(new GristApiClient(journal))
    : new MemoryJournal();
}

function dossierDist(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..", "dist");
}
