// La configuration du serveur, lue et validée au démarrage.
//
// `GRIST_API_KEY` et `GRIST_DOC_URL` n'ont pas de valeur par défaut. En
// développement, sans elles, le serveur utilise un référentiel factice. En
// production, il refuse de démarrer : il servirait des établissements inventés.
//
// `JOURNAL_GRIST_DOC_URL` n'a pas de défaut non plus : le journal des parcours
// n'écrit dans Grist que là où on la pose, en production. Ailleurs, staging
// compris, il accepte les événements sans en garder aucun.
//
// `CONTAINER_VERSION`, que Scalingo pose sur le conteneur, donne le commit
// déployé. Sans elle, le commit vaut `inconnu`, comme côté écran (ADR-14).
//
// Voir le README § « Configuration ».

import { readFileSync } from "node:fs";
import { z } from "zod";
import type { Build } from "./journal/journal-entry.entity.ts";

export type Env = Record<string, string | undefined>;

export type AccesGrist = { docUrl: string; cleApi: string };

export type Configuration = {
  port: number;
  /** Accès au doc Grist ; absent ⇒ référentiel snapshot factice (dev/CI). */
  grist: AccesGrist | undefined;
  /** Accès au journal des parcours ; absent ⇒ journal qui ne garde rien (hors production). */
  journal: AccesGrist | undefined;
  /** Le nom de l'app Scalingo, écrit avec chaque événement ; `local` hors Scalingo. */
  environment: string;
  /** La version et le commit de l'app servie, sur le signe de vie du journal (ADR-15). */
  build: Build;
};

/** Ce que l'exploitant doit corriger : une variable par ligne, et pourquoi. */
export class ErreurDeConfiguration extends Error {
  readonly variables: string[];

  constructor(erreur: z.ZodError) {
    const lignes = erreur.issues.map(
      (probleme) => `  - ${String(probleme.path[0])} : ${probleme.message}`,
    );
    super(
      `Démarrage impossible — configuration invalide :\n${lignes.join("\n")}`,
    );
    this.name = "ErreurDeConfiguration";
    this.variables = erreur.issues.map((probleme) => String(probleme.path[0]));
  }
}

export function lireConfiguration(env: Env = process.env): Configuration {
  const schema = enProduction(env) ? EN_PRODUCTION : VARIABLES;
  const lu = schema.safeParse(sansValeursVides(env));
  if (!lu.success) throw new ErreurDeConfiguration(lu.error);
  const variables = lu.data;
  const cleApi = variables.GRIST_API_KEY;
  return {
    port: variables.PORT,
    grist:
      cleApi && variables.GRIST_DOC_URL
        ? { cleApi, docUrl: variables.GRIST_DOC_URL }
        : sansGrist(),
    journal:
      cleApi && variables.JOURNAL_GRIST_DOC_URL
        ? { cleApi, docUrl: variables.JOURNAL_GRIST_DOC_URL }
        : journalEnMemoire(),
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
  // Le journal des parcours est un autre document, avec la même clé (ADR-6).
  // Sans défaut : la collecte ne s'active que là où on la pose.
  JOURNAL_GRIST_DOC_URL: z.url({ error: "doit être une URL" }).optional(),
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
// `simulateur-eligibilite@<version>` (ADR-14).
function versionDeLApp(): string {
  const chemin = new URL("../package.json", import.meta.url);
  const { version } = JSON.parse(readFileSync(chemin, "utf8")) as {
    version: string;
  };
  return version;
}

function journalEnMemoire(): undefined {
  console.warn(
    "[simulateur] JOURNAL_GRIST_DOC_URL ou GRIST_API_KEY absente — journal des parcours désactivé, aucun événement n'est gardé.",
  );
  return undefined;
}

function sansGrist(): undefined {
  console.warn(
    "[simulateur] GRIST_API_KEY ou GRIST_DOC_URL absente — référentiel snapshot (dev/fallback).",
  );
  return undefined;
}
