// Une entrée du journal des parcours : un événement tel que le navigateur l'a
// envoyé, daté à sa réception par le serveur. Voir
// docs/knowledge/adr/analytics.md, ADR-6.

import { isDeepStrictEqual } from "node:util";
import {
  type AnalyticsEvent,
  SCHEMA_VERSION,
} from "../../shared/analytics/analytics-event.ts";

export class JournalEntry {
  readonly event: AnalyticsEvent;
  readonly receivedAt: string;
  /** Où le serveur tourne : production, staging, local… */
  readonly environment: string;
  /** La version de nos compléments au contrat d'ANA-1015. */
  readonly schemaVersion: number;

  constructor(
    event: AnalyticsEvent,
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

  get eventId(): string {
    return this.event.event_id;
  }

  /** Vrai si l'autre entrée porte le même événement : c'est un renvoi. */
  repeats(other: JournalEntry): boolean {
    return isDeepStrictEqual(this.event, other.event);
  }
}
