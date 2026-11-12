// Le port du journal des parcours : ce que le domaine attend d'un stockage. Il
// ne dit ni table, ni colonne, ni JSON. Grist en est le premier adaptateur
// (`grist-journal.ts`), la mémoire le second (`memory-journal.ts`). Voir
// docs/knowledge/adr/analytics.md, ADR-7.

import type { AnalyticsEvent } from "../../shared/analytics/analytics-event.ts";

/** Un événement tel que le journal le garde : reçu, puis daté par le serveur. */
export type RecordedEvent = {
  event: AnalyticsEvent;
  receivedAt: string;
  environment: string;
  schemaVersion: number;
};

export interface Journal {
  find(eventId: string): Promise<RecordedEvent | undefined>;
  append(recorded: RecordedEvent): Promise<void>;
  /** Garde à part un événement qui reprend l'`event_id` d'un autre. */
  setAside(collision: RecordedEvent): Promise<void>;
}
