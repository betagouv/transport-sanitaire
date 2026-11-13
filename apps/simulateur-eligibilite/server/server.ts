// Point d'entrée du serveur : il sert le front et l'API. La configuration est
// lue par `configuration.ts`.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { creerApp } from "./app.ts";
import { type Configuration, lireConfiguration } from "./configuration.ts";
import { adaptersFor, createContainer } from "./container.ts";

const configuration = configurationOuArret();

const container = createContainer(adaptersFor(configuration));
const app = creerApp(container, { dossierDist: dossierDist() });

app.listen(configuration.port, () => {
  console.log(`[simulateur] à l'écoute sur le port ${configuration.port}`);
  chaqueHeure(() => container.reportAlive.execute(new Date()));
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

// Le signe de vie de la collecte (ADR-15) : tout de suite, puis à chaque heure
// pleine. Un échec se dit dans les journaux du serveur sans l'arrêter : l'heure
// restera sans signe de vie, et ressortira indisponible.
function chaqueHeure(action: () => Promise<void>): void {
  const lancer = () =>
    action().catch((err: unknown) => {
      console.error("[simulateur] signe de vie non écrit:", err);
    });
  const prochaineHeure = () => {
    const ms = HEURE - (Date.now() % HEURE);
    setTimeout(() => {
      lancer();
      prochaineHeure();
    }, ms);
  };
  lancer();
  prochaineHeure();
}

const HEURE = 60 * 60 * 1000;

function dossierDist(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..", "dist");
}
