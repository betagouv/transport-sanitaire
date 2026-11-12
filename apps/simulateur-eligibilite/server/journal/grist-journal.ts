// L'adaptateur Grist du journal (ADR-7) : le seul à connaître le document
// « Simulateur-Parcours ». Chaque événement y est une ligne : des colonnes
// communes à tous les types, pour filtrer, et l'événement entier en JSON dans
// `payload`, pour le relire tel quel. La table ne change pas quand le contrat
// gagne un champ.

import type { AccesGrist } from "../configuration.ts";
import {
  creerLigne,
  type LigneGrist,
  lignes,
  ouvrirDoc,
} from "../grist/lignes-grist.ts";
import type { Journal, RecordedEvent } from "./journal.ts";

export function gristJournal({ docUrl, cleApi }: AccesGrist): Journal {
  const doc = ouvrirDoc(docUrl, cleApi);
  return {
    find: async (eventId) => {
      const [ligne] = await lignes(doc, EVENTS, { event_id: [eventId] });
      return ligne && recordedFrom(ligne);
    },
    append: async (recorded) => {
      await creerLigne(doc, EVENTS, rowOf(recorded));
    },
    setAside: async (collision) => {
      await creerLigne(doc, COLLISIONS, rowOf(collision));
    },
  };
}

// ---- implémentation ----

const EVENTS = "Evenements";
const COLLISIONS = "Collisions";

function rowOf({
  event,
  receivedAt,
  environment,
  schemaVersion,
}: RecordedEvent) {
  return {
    event_id: event.event_id,
    simulation_id: event.simulation_id,
    sequence: event.sequence ?? null,
    type: event.type,
    occurred_at: event.occurred_at,
    received_at: receivedAt,
    environment,
    schema_version: schemaVersion,
    is_test: event.is_test ?? null,
    payload: JSON.stringify(event),
  };
}

function recordedFrom({ fields }: LigneGrist): RecordedEvent {
  return {
    event: JSON.parse(String(fields.payload)),
    receivedAt: String(fields.received_at),
    environment: String(fields.environment),
    schemaVersion: Number(fields.schema_version),
  };
}
