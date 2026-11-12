// Le journal en mémoire : pour les tests, et pour le développement sans clé
// Grist. Il se vide à l'arrêt du serveur.

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
