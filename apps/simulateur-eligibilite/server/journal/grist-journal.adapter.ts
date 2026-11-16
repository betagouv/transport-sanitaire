// L'adaptateur Grist du journal (ADR-0043) : le seul à connaître les tables du
// document « Simulateur-Parcours ». Chaque entrée y est une ligne : des
// colonnes communes à tous les types, pour filtrer, et l'événement entier en
// JSON dans `payload`, pour le relire tel quel. La table ne change pas quand
// le contrat gagne un champ.
//
// L'établissement et le service ont chacun leur colonne, en JSON brut, qui
// s'exploite sans ouvrir `payload` : `{"id":"12","name":"CHU Grenoble Alpes"}`
// (ADR-0053).

import type { RattachementDuParcours } from "../../shared/analytics/analytics-event.ts";
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
    simulation_id: event.simulation_id ?? null,
    sequence: event.sequence ?? null,
    type: event.type,
    occurred_at: event.occurred_at,
    received_at: receivedAt,
    environment,
    schema_version: schemaVersion,
    is_test: event.is_test ?? null,
    ...rattachementOf(event),
    payload: JSON.stringify(event),
  };
}

/** Ni nom ni id : la cellule reste vide. */
type EmptyCell = null;

// Les deux colonnes du rattachement. Le signe de vie n'appartient à aucun
// parcours : il n'en a pas.
function rattachementOf(event: JournalEntry["event"]) {
  const of: RattachementDuParcours = event.type === "alive" ? {} : event;
  return {
    establishment: json(of.establishment_id, of.establishment_name),
    service: json(of.service_id, of.service_name),
  };
}

// `{"id":"12","name":"CHU Grenoble Alpes"}`. Un établissement saisi n'a pas
// d'id, et un rattachement de repli n'a pas de nom : la clé manque.
function json(id?: string, name?: string): string | EmptyCell {
  return id || name ? JSON.stringify({ id, name }) : null;
}

function entryOf({ fields }: GristRow): JournalEntry {
  return new JournalEntry(
    JSON.parse(String(fields.payload)),
    String(fields.received_at),
    String(fields.environment),
    Number(fields.schema_version),
  );
}
