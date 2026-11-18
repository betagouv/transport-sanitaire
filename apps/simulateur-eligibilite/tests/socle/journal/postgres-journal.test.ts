// @vitest-environment node
//
// L'adaptateur PostgreSQL du journal, contre une vraie base Postgres en
// mémoire (PGlite) : un événement écrit se relit tel quel, une collision et
// une quarantaine vont dans leur table, l'établissement et le service ont
// chacun leur colonne (ADR-0053).

import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JournalEntry } from "../../../server/journal/journal-entry.entity.ts";
import { PostgresJournal } from "../../../server/journal/postgres-journal.adapter.ts";
import { BUILD, simulationStarted } from "./evenements.ts";

let base: PGlite;
let journal: PostgresJournal;

beforeEach(() => {
  base = new PGlite();
  journal = new PostgresJournal(base);
});
afterEach(() => base.close());

const recu = (event: object) =>
  new JournalEntry(
    { ...simulationStarted, ...event },
    "2026-11-12T09:00:01.000Z",
    "staging",
    "f30aafe",
    1,
  );

const lignes = async (table: string, colonnes: string) =>
  (await base.query(`SELECT ${colonnes} FROM ${table} ORDER BY id`)).rows;

describe("journal dans PostgreSQL", () => {
  it("relit l'événement écrit tel qu'il est arrivé", async () => {
    await journal.append(recu({}));

    expect(await journal.find("s-1:1")).toEqual(recu({}));
    expect(await journal.find("s-1:2")).toBeUndefined();
  });

  it("n'écrit qu'une fois un événement déjà gardé", async () => {
    await journal.append(recu({}));
    await journal.append(recu({}));

    expect(await lignes("journal_events", "event_id")).toEqual([
      { event_id: "s-1:1" },
    ]);
  });

  it("garde une collision et une quarantaine à part, avec sa raison", async () => {
    const collision = recu({ service_id: "s_grenoble_pneumo" });
    const inconnu = recu({ event_id: "s-1:2", establishment_id: "e_x" });

    await journal.setAside(collision);
    await journal.quarantine(inconnu, "unknown_establishment");

    expect(await lignes("journal_collisions", "payload")).toEqual([
      { payload: collision.event },
    ]);
    expect(await lignes("journal_quarantine", "event_id, reason")).toEqual([
      { event_id: "s-1:2", reason: "unknown_establishment" },
    ]);
    expect(await journal.find("s-1:2")).toBeUndefined();
  });

  it("écrit l'établissement, le service et le commit en colonnes", async () => {
    await journal.append(recu({}));
    // Un établissement saisi n'a pas d'id.
    await journal.append(
      recu({
        event_id: "s-2:1",
        establishment_id: undefined,
        service_id: "autre",
      }),
    );

    expect(
      await lignes(
        "journal_events",
        "establishment_id, service_id, commit_sha",
      ),
    ).toEqual([
      {
        establishment_id: "e_chu_grenoble",
        service_id: "s_grenoble_cardio",
        commit_sha: "f30aafe",
      },
      { establishment_id: null, service_id: "autre", commit_sha: "f30aafe" },
    ]);
  });

  it("retrouve la mesure d'un document de la simulation", async () => {
    const mesure = recu({
      event_id: "s-1:7",
      type: "document_typography_measured",
      document_id: "d-1",
    });
    await journal.append(recu({}));
    await journal.append(mesure);

    expect(await journal.findMeasurement("s-1", "d-1")).toEqual(mesure);
    expect(await journal.findMeasurement("s-1", "d-2")).toBeUndefined();
  });

  it("laisse le rattachement vide sur le signe de vie", async () => {
    await journal.append(
      JournalEntry.alive(new Date("2026-11-16T10:00:00Z"), BUILD, "staging"),
    );

    expect(
      await lignes(
        "journal_events",
        "simulation_id, establishment_id, service_id",
      ),
    ).toEqual([
      { simulation_id: null, establishment_id: null, service_id: null },
    ]);
  });
});
