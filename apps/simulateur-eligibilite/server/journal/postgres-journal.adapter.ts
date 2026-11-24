// L'adaptateur PostgreSQL du journal : le seul à connaître ses
// tables. Chaque entrée y est une ligne : des colonnes communes à tous les
// types, pour filtrer, et l'événement entier en JSON dans `payload`, pour le
// relire tel quel. La table ne change pas quand le contrat gagne un champ.
//
// Une collision va dans `journal_collisions`, un événement hors du référentiel
// dans `journal_quarantine`, avec sa raison (ANA22-01). L'établissement et le
// service ont chacun leur colonne, le commit du serveur qui a reçu
// l'événement aussi : le contrat ne le porte pas.
//
// Les tables se créent à la première requête si elles manquent.

import type { RattachementDuParcours } from "../../shared/analytics/analytics-event.ts";
import type { Sql } from "../postgres/postgres.client.ts";
import type {
  Journal,
  NotInTheJournal,
  QuarantineReason,
} from "./journal.port.ts";
import { JournalEntry } from "./journal-entry.entity.ts";
import type {
  Cursor,
  FromTheStart,
  JournalPage,
  JournalPages,
} from "./journal-pages.port.ts";

export class PostgresJournal implements Journal, JournalPages {
  readonly #sql: Sql;
  #tables: Promise<void> | undefined;

  constructor(sql: Sql) {
    this.#sql = sql;
  }

  async find(eventId: string): Promise<JournalEntry | NotInTheJournal> {
    const [row] = await this.#select("WHERE event_id = $1", [eventId]);
    return row && entryOf(row);
  }

  async findMeasurement(
    simulationId: string,
    documentId: string,
  ): Promise<JournalEntry | NotInTheJournal> {
    const rows = await this.#select(
      "WHERE simulation_id = $1 AND type = $2 ORDER BY id",
      [simulationId, MEASUREMENT],
    );
    return rows
      .map(entryOf)
      .find((entry) => entry.measures(simulationId, documentId));
  }

  // Deux envois simultanés du même événement passent tous deux `find` : la
  // contrainte d'unicité n'en garde qu'un.
  async append(entry: JournalEntry): Promise<void> {
    await this.#insert(EVENTS, entry, "ON CONFLICT (event_id) DO NOTHING");
  }

  async setAside(collision: JournalEntry): Promise<void> {
    await this.#insert(COLLISIONS, collision);
  }

  async quarantine(entry: JournalEntry, reason: QuarantineReason) {
    await this.#ready();
    const values = [...valuesOf(entry), reason];
    await this.#sql.query(
      `INSERT INTO ${QUARANTINE} (${COLUMNS}, reason) VALUES (${placeholders(values)})`,
      values,
    );
  }

  // Le curseur est l'id de la ligne, que la base attribue dans l'ordre des
  // écritures.
  async pageAfter(
    after: Cursor | FromTheStart,
    size: number,
  ): Promise<JournalPage> {
    const rows = await this.#select("WHERE id > $1 ORDER BY id LIMIT $2", [
      after ?? "0",
      size,
    ]);
    const last = rows.length === size ? rows.at(-1) : undefined;
    return { entries: rows.map(entryOf), next: last?.cursor ?? null };
  }

  async #select(where: string, params: unknown[]): Promise<StoredRow[]> {
    await this.#ready();
    const { rows } = await this.#sql.query<StoredRow>(
      `SELECT ${STORED} FROM ${EVENTS} ${where}`,
      params,
    );
    return rows;
  }

  async #insert(table: string, entry: JournalEntry, onConflict = "") {
    await this.#ready();
    const values = valuesOf(entry);
    await this.#sql.query(
      `INSERT INTO ${table} (${COLUMNS}) VALUES (${placeholders(values)}) ${onConflict}`,
      values,
    );
  }

  // Une création qui échoue se retente à la requête suivante.
  #ready(): Promise<void> {
    this.#tables ??= createTables(this.#sql).catch((err: unknown) => {
      this.#tables = undefined;
      throw err;
    });
    return this.#tables;
  }
}

// ---- implémentation ----

const EVENTS = "journal_events";
const COLLISIONS = "journal_collisions";
const QUARANTINE = "journal_quarantine";
const MEASUREMENT = "document_typography_measured";

const COMMON_COLUMNS = `
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id text NOT NULL,
  simulation_id text,
  sequence bigint,
  type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL,
  environment text NOT NULL,
  commit_sha text NOT NULL,
  schema_version integer NOT NULL,
  is_test boolean,
  establishment_id text,
  service_id text,
  payload jsonb NOT NULL`;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS ${EVENTS} (${COMMON_COLUMNS}, UNIQUE (event_id))`,
  `CREATE INDEX IF NOT EXISTS ${EVENTS}_by_simulation ON ${EVENTS} (simulation_id, type)`,
  `CREATE TABLE IF NOT EXISTS ${COLLISIONS} (${COMMON_COLUMNS})`,
  `CREATE TABLE IF NOT EXISTS ${QUARANTINE} (${COMMON_COLUMNS}, reason text NOT NULL)`,
];

async function createTables(sql: Sql): Promise<void> {
  for (const statement of SCHEMA) await sql.query(statement);
}

// Les colonnes écrites, dans l'ordre de `valuesOf`.
const COLUMNS = [
  "event_id",
  "simulation_id",
  "sequence",
  "type",
  "occurred_at",
  "received_at",
  "environment",
  "commit_sha",
  "schema_version",
  "is_test",
  "establishment_id",
  "service_id",
  "payload",
].join(", ");

function valuesOf(entry: JournalEntry): unknown[] {
  const { event, receivedAt, environment, commitSha, schemaVersion } = entry;
  // Le signe de vie n'appartient à aucun parcours : il n'a pas de rattachement.
  const of: RattachementDuParcours = event.type === "alive" ? {} : event;
  return [
    event.event_id,
    event.simulation_id ?? null,
    event.sequence ?? null,
    event.type,
    event.occurred_at,
    receivedAt,
    environment,
    commitSha,
    schemaVersion,
    event.is_test ?? null,
    of.establishment_id ?? null,
    of.service_id ?? null,
    JSON.stringify(event),
  ];
}

function placeholders(values: unknown[]): string {
  return values.map((_, i) => `$${i + 1}`).join(", ");
}

// Ce qu'une ligne relue rend à l'entrée.
const STORED =
  "id::text AS cursor, payload, received_at, environment, commit_sha, schema_version";

type StoredRow = {
  cursor: Cursor;
  payload: JournalEntry["event"];
  received_at: Date;
  environment: string;
  commit_sha: string;
  schema_version: number;
};

function entryOf(row: StoredRow): JournalEntry {
  return new JournalEntry(
    row.payload,
    row.received_at.toISOString(),
    row.environment,
    row.commit_sha,
    row.schema_version,
  );
}
