// Les types de la configuration du serveur : l'environnement lu, et ce qu'on en
// tire. `configuration.adapter.ts` le lit et le valide.

import type { AccesGrist } from "./grist/grist-api.client.ts";
import type { Build } from "./journal/journal-entry.entity.ts";

export type Env = Record<string, string | undefined>;

export type Configuration = {
  port: number;
  /** Accès au doc Grist ; absent ⇒ référentiel snapshot factice (dev/CI). */
  grist: AccesGrist | undefined;
  /** L'URL de la base du journal des parcours ; absente ⇒ journal qui ne garde rien. */
  journal: string | undefined;
  /** Le jeton qui ouvre la lecture du journal ; absent ⇒ pas de lecture. */
  journalReadToken: string | undefined;
  /** Le nom de l'app Scalingo, écrit avec chaque événement ; `local` hors Scalingo. */
  environment: string;
  /** La version et le commit de l'app servie, sur le signe de vie du journal. */
  build: Build;
};
