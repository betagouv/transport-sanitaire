// La configuration du serveur, lue et validée au démarrage.
//
// `GRIST_API_KEY` et `GRIST_DOC_URL` n'ont pas de valeur par défaut. En
// développement, sans elles, le serveur utilise un référentiel factice. En
// production, il refuse de démarrer : il servirait des établissements inventés.
//
// `SCALINGO_POSTGRESQL_URL`, que Scalingo pose avec l'addon PostgreSQL, donne
// la base du journal des parcours. Sans elle, le journal accepte les
// événements sans en garder aucun.
//
// `CONTAINER_VERSION`, que Scalingo pose sur le conteneur, donne le commit
// déployé. Sans elle, le commit vaut `inconnu`, comme côté écran.
//
// Voir le README § « Configuration ».

import { readFileSync } from "node:fs";
import { z } from "zod";
import {
  ErreurDeConfiguration,
  type ProblemeDeConfiguration,
} from "./configuration.error.ts";
import type { Configuration, Env } from "./configuration.types.ts";

export function lireConfiguration(env: Env = process.env): Configuration {
  const schema = enProduction(env) ? EN_PRODUCTION : VARIABLES;
  const lu = schema.safeParse(sansValeursVides(env));
  if (!lu.success) throw new ErreurDeConfiguration(problemesDe(lu.error));
  const variables = lu.data;
  const cleApi = variables.GRIST_API_KEY;
  return {
    port: variables.PORT,
    grist:
      cleApi && variables.GRIST_DOC_URL
        ? { cleApi, docUrl: variables.GRIST_DOC_URL }
        : sansGrist(),
    journal: variables.SCALINGO_POSTGRESQL_URL ?? sansJournal(),
    journalReadToken: variables.JOURNAL_READ_TOKEN,
    environment: variables.APP,
    build: {
      app_version: versionDeLApp(),
      commit_sha: variables.CONTAINER_VERSION?.slice(0, 7) ?? "inconnu",
    },
  };
}

// ---- implémentation ----

// Les variables du serveur (README § Configuration). Hors production, aucune
// n'empêche de démarrer : `PORT` et `APP` ont un défaut, et sans Grist le
// référentiel est factice et le journal ne garde rien.
const VARIABLES = z.object({
  PORT: z.coerce
    .number({ error: "doit être un numéro de port" })
    .int({ error: "doit être un entier" })
    .positive({ error: "doit être un entier positif" })
    .default(3000),
  GRIST_DOC_URL: z.url({ error: "doit être une URL" }).optional(),
  // La base du journal des parcours, posée par l'addon PostgreSQL de Scalingo.
  // Sans défaut : la collecte ne garde rien là où l'addon manque.
  SCALINGO_POSTGRESQL_URL: z.url({ error: "doit être une URL" }).optional(),
  // Le jeton du tableau de bord qui lit le journal. Long, pour ne pas se
  // deviner : `openssl rand -hex 32` en donne un.
  JOURNAL_READ_TOKEN: z
    .string()
    .min(32, { error: "doit compter au moins 32 caractères" })
    .optional(),
  GRIST_API_KEY: z.string().optional(),
  // Scalingo pose le nom de l'app : il distingue la production de la
  // préproduction dans le journal, sans variable de plus.
  APP: z.string().default("local"),
  // Scalingo pose le commit déployé sur le conteneur qui tourne. Un autre
  // format n'est pas un commit : on l'avoue `inconnu`.
  CONTAINER_VERSION: z
    .string()
    .regex(/^[0-9a-f]{7,40}$/)
    .optional()
    .catch(undefined),
});

// En production, les variables du référentiel deviennent obligatoires. C'est la
// seule différence entre les deux environnements.
const SANS_DEFAUT =
  "sans valeur par défaut, elle doit être posée en production";

const EN_PRODUCTION = VARIABLES.extend({
  GRIST_DOC_URL: z.url({
    error: (probleme) =>
      probleme.input === undefined ? SANS_DEFAUT : "doit être une URL",
  }),
  GRIST_API_KEY: z.string({ error: SANS_DEFAUT }),
});

// Ce que le validateur reproche, une variable à la fois : la première clé du
// chemin nomme la variable.
function problemesDe(erreur: z.ZodError): ProblemeDeConfiguration[] {
  return erreur.issues.map((probleme) => ({
    variable: String(probleme.path[0]),
    raison: probleme.message,
  }));
}

// Scalingo fournit `PORT` et pose `NODE_ENV=production`. C'est donc lui qui
// distingue le déploiement du poste de développement, sans variable de plus.
function enProduction(env: Env): boolean {
  return env.NODE_ENV?.trim() === "production";
}

// Une variable vide vaut une variable absente : `GRIST_API_KEY=` dans un `.env`
// recopié n'est pas une clé. Les vides retirés, le schéma applique ses défauts
// et exige le reste.
function sansValeursVides(env: Env): Env {
  const remplies = Object.entries(env).filter(([, brut]) => brut?.trim());
  return Object.fromEntries(remplies.map(([nom, brut]) => [nom, brut?.trim()]));
}

// La version que `package.json` déclare, celle du tag
// `simulateur-eligibilite@<version>`.
function versionDeLApp(): string {
  const chemin = new URL("../package.json", import.meta.url);
  const { version } = JSON.parse(readFileSync(chemin, "utf8")) as {
    version: string;
  };
  return version;
}

function sansJournal(): undefined {
  console.warn(
    "[simulateur] SCALINGO_POSTGRESQL_URL absente — journal des parcours désactivé, aucun événement n'est gardé.",
  );
  return undefined;
}

function sansGrist(): undefined {
  console.warn(
    "[simulateur] GRIST_API_KEY ou GRIST_DOC_URL absente — référentiel snapshot (dev/fallback).",
  );
  return undefined;
}
