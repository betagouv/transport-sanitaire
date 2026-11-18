// Le journal en mémoire, pour les tests : il garde tout, jusqu'à l'arrêt du
// serveur. Le serveur sans base prend `DiscardingJournal`, qui ne garde rien.

import type {
  Journal,
  NotInTheJournal,
  QuarantineReason,
} from "./journal.port.ts";
import type { JournalEntry } from "./journal-entry.entity.ts";
import type {
  Cursor,
  FromTheStart,
  JournalPage,
  JournalPages,
} from "./journal-pages.port.ts";

export class MemoryJournal implements Journal, JournalPages {
  readonly collisions: JournalEntry[] = [];
  readonly quarantined: { entry: JournalEntry; reason: QuarantineReason }[] =
    [];
  readonly #entries = new Map<string, JournalEntry>();

  async find(eventId: string): Promise<JournalEntry | NotInTheJournal> {
    return this.#entries.get(eventId);
  }

  async findMeasurement(
    simulationId: string,
    documentId: string,
  ): Promise<JournalEntry | NotInTheJournal> {
    return [...this.#entries.values()].find((entry) =>
      entry.measures(simulationId, documentId),
    );
  }

  async append(entry: JournalEntry): Promise<void> {
    this.#entries.set(entry.eventId, entry);
  }

  // Le curseur est le rang de la dernière entrée lue.
  async pageAfter(
    after: Cursor | FromTheStart,
    size: number,
  ): Promise<JournalPage> {
    const start = Number(after ?? 0);
    const entries = [...this.#entries.values()].slice(start, start + size);
    const full = entries.length === size;
    return { entries, next: full ? String(start + size) : null };
  }

  async setAside(collision: JournalEntry): Promise<void> {
    this.collisions.push(collision);
  }

  async quarantine(entry: JournalEntry, reason: QuarantineReason) {
    this.quarantined.push({ entry, reason });
  }
}
