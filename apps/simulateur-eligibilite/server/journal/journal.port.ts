// Le port du journal des parcours : ce que la collecte attend d'un stockage.
// Il ne dit ni table, ni colonne, ni JSON. Grist en est le premier adaptateur
// (`grist-journal.adapter.ts`), la mémoire le second
// (`memory-journal.adapter.ts`). Voir docs/knowledge/adr/analytics.md, ADR-7.

import type { JournalEntry } from "./journal-entry.entity.ts";

/** Aucune entrée ne porte cet `event_id`. */
export type NotInTheJournal = undefined;

export interface Journal {
  find(eventId: string): Promise<JournalEntry | NotInTheJournal>;
  append(entry: JournalEntry): Promise<void>;
  /** Garde à part une entrée qui reprend l'`event_id` d'une autre. */
  setAside(collision: JournalEntry): Promise<void>;
}
