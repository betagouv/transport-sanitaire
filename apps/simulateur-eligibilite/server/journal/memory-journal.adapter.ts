// Le journal en mémoire, pour les tests : il garde tout, jusqu'à l'arrêt du
// serveur. Le serveur sans doc Grist prend `DiscardingJournal`, qui ne garde rien.

import type { Journal, NotInTheJournal } from "./journal.port.ts";
import type { JournalEntry } from "./journal-entry.entity.ts";

export class MemoryJournal implements Journal {
  readonly collisions: JournalEntry[] = [];
  readonly #entries = new Map<string, JournalEntry>();

  async find(eventId: string): Promise<JournalEntry | NotInTheJournal> {
    return this.#entries.get(eventId);
  }

  async append(entry: JournalEntry): Promise<void> {
    this.#entries.set(entry.eventId, entry);
  }

  async setAside(collision: JournalEntry): Promise<void> {
    this.collisions.push(collision);
  }
}
