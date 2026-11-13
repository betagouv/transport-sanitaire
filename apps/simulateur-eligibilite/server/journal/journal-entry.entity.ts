// Une entrée du journal des parcours : un événement tel que le navigateur l'a
// envoyé, daté à sa réception par le serveur, ou le signe de vie que le
// serveur écrit chaque heure. Voir docs/knowledge/adr/analytics.md, ADR-6 et
// ADR-15.

import { isDeepStrictEqual } from "node:util";
import {
  type AnalyticsEvent,
  SCHEMA_VERSION,
} from "../../shared/analytics/analytics-event.ts";

/** Ce que le serveur sait de l'app qu'il sert : sa version et son commit. */
export type Build = Pick<AnalyticsEvent, "app_version" | "commit_sha">;

/**
 * Le signe de vie de la collecte : le serveur l'écrit chaque heure. Une heure
 * sans lui est une heure sans collecte, pas une heure sans usage (ADR-15). Il
 * n'appartient à aucune simulation.
 */
export type AliveEvent = Build & {
  event_id: string;
  type: "alive";
  occurred_at: string;
  simulation_id?: never;
  sequence?: never;
  is_test?: never;
};

export class JournalEntry {
  readonly event: AnalyticsEvent | AliveEvent;
  readonly receivedAt: string;
  /** Où le serveur tourne : production, staging, local… */
  readonly environment: string;
  /** La version de nos compléments au contrat d'ANA-1015. */
  readonly schemaVersion: number;

  constructor(
    event: AnalyticsEvent | AliveEvent,
    receivedAt: string,
    environment: string,
    schemaVersion: number = SCHEMA_VERSION,
  ) {
    this.event = event;
    this.receivedAt = receivedAt;
    this.environment = environment;
    this.schemaVersion = schemaVersion;
  }

  /** L'événement, reçu à l'instant. */
  static receivedNow(event: AnalyticsEvent, environment: string): JournalEntry {
    return new JournalEntry(event, new Date().toISOString(), environment);
  }

  /**
   * Le signe de vie de l'heure en cours. Son identifiant tient l'heure et la
   * version : deux serveurs de la même version n'écrivent qu'une ligne par
   * heure, et une version qui démarre en cours d'heure a la sienne.
   */
  static alive(now: Date, build: Build, environment: string): JournalEntry {
    const at = now.toISOString();
    const hour = at.slice(0, "2026-11-13T15".length);
    const { app_version, commit_sha } = build;
    const event: AliveEvent = {
      event_id: `alive:${hour}:${app_version}:${commit_sha}`,
      type: "alive",
      occurred_at: at,
      app_version,
      commit_sha,
    };
    return new JournalEntry(event, at, environment);
  }

  get eventId(): string {
    return this.event.event_id;
  }

  /** Vrai si l'autre entrée porte le même événement : c'est un renvoi. */
  repeats(other: JournalEntry): boolean {
    return isDeepStrictEqual(this.event, other.event);
  }
}
