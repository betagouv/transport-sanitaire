// L'adaptateur Grist du journal (ADR-7) : le seul à connaître les tables du
// document « Simulateur-Parcours ». Chaque entrée y est une ligne : des
// colonnes communes à tous les types, pour filtrer, et l'événement entier en
// JSON dans `payload`, pour le relire tel quel. La table ne change pas quand
// le contrat gagne un champ.

import type { GristApiClient, GristRow } from "../grist/grist-api.client.ts";
import type { Journal, NotInTheJournal } from "./journal.port.ts";
import { JournalEntry } from "./journal-entry.entity.ts";

export class GristJournal implements Journal {
  readonly #grist: GristApiClient;

  constructor(grist: GristApiClient) {
    this.#grist = grist;
  }

  async find(eventId: string): Promise<JournalEntry | NotInTheJournal> {
    const [row] = await this.#grist.rows(EVENTS, { event_id: [eventId] });
    return row && entryOf(row);
  }

  async append(entry: JournalEntry): Promise<void> {
    await this.#grist.addRow(EVENTS, rowOf(entry));
  }

  async setAside(collision: JournalEntry): Promise<void> {
    await this.#grist.addRow(COLLISIONS, rowOf(collision));
  }
}

// ---- implémentation ----

const EVENTS = "Evenements";
const COLLISIONS = "Collisions";

function rowOf({
  event,
  receivedAt,
  environment,
  schemaVersion,
}: JournalEntry) {
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

function entryOf({ fields }: GristRow): JournalEntry {
  return new JournalEntry(
    JSON.parse(String(fields.payload)),
    String(fields.received_at),
    String(fields.environment),
    Number(fields.schema_version),
  );
}
