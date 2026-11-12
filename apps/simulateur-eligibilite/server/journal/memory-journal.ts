// Le journal en mémoire : pour les tests, et pour le développement sans clé
// Grist. Il se vide à l'arrêt du serveur.

import type { Journal, RecordedEvent } from "./journal.ts";

export type MemoryJournal = Journal & { collisions: RecordedEvent[] };

export function memoryJournal(): MemoryJournal {
  const events = new Map<string, RecordedEvent>();
  const collisions: RecordedEvent[] = [];
  return {
    collisions,
    find: async (eventId) => events.get(eventId),
    append: async (recorded) => {
      events.set(recorded.event.event_id, recorded);
    },
    setAside: async (collision) => {
      collisions.push(collision);
    },
  };
}
