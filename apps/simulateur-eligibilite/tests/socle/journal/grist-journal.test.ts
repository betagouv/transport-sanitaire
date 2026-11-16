// @vitest-environment node
//
// L'adaptateur Grist du journal, contre un Grist en mémoire servi en HTTP : un
// événement écrit se relit tel quel, une collision va dans sa table, et
// l'établissement et le service ont chacun leur colonne (ADR-16).

import { afterEach, describe, expect, it } from "vitest";
import { GristApiClient } from "../../../server/grist/grist-api.client.ts";
import { GristJournal } from "../../../server/journal/grist-journal.adapter.ts";
import { JournalEntry } from "../../../server/journal/journal-entry.entity.ts";
import { demarrerGrist, type GristDeTest } from "../server/grist-de-test.ts";
import { BUILD, simulationStarted } from "./evenements.ts";

let grist: GristDeTest;
afterEach(() => grist.close());

const recu = (event: object) =>
  new JournalEntry(
    { ...simulationStarted, ...event },
    "2026-11-12T09:00:01.000Z",
    "staging",
    1,
  );

const colonnes = (lignes: GristDeTest["tables"][string] = []) =>
  lignes.map(({ fields }) => [fields.establishment, fields.service]);

describe("journal dans Grist", () => {
  it("relit l'événement écrit, et garde une collision à part", async () => {
    grist = await demarrerGrist({});
    const journal = new GristJournal(
      new GristApiClient({ docUrl: grist.docUrl, cleApi: "test" }),
    );
    const collision = recu({ service_id: "s_grenoble_pneumo" });

    await journal.append(recu({}));
    await journal.setAside(collision);

    expect(await journal.find("s-1:1")).toEqual(recu({}));
    expect(await journal.find("s-1:2")).toBeUndefined();
    expect(grist.tables.Collisions?.map((l) => l.fields.payload)).toEqual([
      JSON.stringify(collision.event),
    ]);
  });

  it("écrit l'établissement et le service en colonnes, en JSON", async () => {
    grist = await demarrerGrist({});
    const journal = new GristJournal(
      new GristApiClient({ docUrl: grist.docUrl, cleApi: "test" }),
    );

    await journal.append(
      recu({
        establishment_name: "CHU Grenoble Alpes",
        service_name: "Cardiologie",
      }),
    );
    // Un établissement saisi n'a pas d'id, et un repli n'a pas de nom.
    await journal.append(
      recu({
        event_id: "s-2:1",
        establishment_id: undefined,
        establishment_name: "Clinique des Cèdres",
        service_id: "autre",
      }),
    );

    expect(colonnes(grist.tables.Evenements)).toEqual([
      [
        '{"id":"e_chu_grenoble","name":"CHU Grenoble Alpes"}',
        '{"id":"s_grenoble_cardio","name":"Cardiologie"}',
      ],
      ['{"name":"Clinique des Cèdres"}', '{"id":"autre"}'],
    ]);
  });

  it("laisse les deux colonnes vides sur le signe de vie", async () => {
    grist = await demarrerGrist({});
    const journal = new GristJournal(
      new GristApiClient({ docUrl: grist.docUrl, cleApi: "test" }),
    );

    await journal.append(
      JournalEntry.alive(new Date("2026-11-16T10:00:00Z"), BUILD, "staging"),
    );

    expect(colonnes(grist.tables.Evenements)).toEqual([[null, null]]);
  });
});
