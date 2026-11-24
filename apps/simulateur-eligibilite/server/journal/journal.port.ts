// Le port du journal des parcours : ce que la collecte attend d'un stockage.
// Il ne dit ni table, ni colonne, ni JSON. PostgreSQL en est l'adaptateur
// (`postgres-journal.adapter.ts`), après Grist, et la mémoire celui des tests
// (`memory-journal.adapter.ts`).

import type { JournalEntry } from "./journal-entry.entity.ts";

/**
 * Pourquoi un événement va en quarantaine : son établissement n'est pas au
 * référentiel, ou son service n'est pas sous son établissement (ANA22-01).
 */
export type QuarantineReason =
  | "unknown_establishment"
  | "service_outside_establishment";

/** Aucune entrée ne porte cet `event_id`. */
export type NotInTheJournal = undefined;

export interface Journal {
  find(eventId: string): Promise<JournalEntry | NotInTheJournal>;
  /** La taille des champs d'un document de la simulation (ANA22-03). */
  findMeasurement(
    simulationId: string,
    documentId: string,
  ): Promise<JournalEntry | NotInTheJournal>;
  append(entry: JournalEntry): Promise<void>;
  /** Garde à part une entrée qui reprend l'`event_id` d'une autre. */
  setAside(collision: JournalEntry): Promise<void>;
  /** Garde à part, avec sa raison, une entrée hors du référentiel. */
  quarantine(entry: JournalEntry, reason: QuarantineReason): Promise<void>;
}
