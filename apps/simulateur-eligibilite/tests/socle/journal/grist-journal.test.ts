// @vitest-environment node
//
// L'adaptateur Grist du journal, contre un Grist en mémoire servi en HTTP : un
// événement écrit se relit tel quel, une collision va dans sa table, et
// l'établissement et le service ont chacun leur colonne (ADR-0053).

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
    "f30aafe",
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

    await journal.append(recu({}));
    // Un établissement saisi n'a pas d'id.
    await journal.append(
      recu({
        event_id: "s-2:1",
        establishment_id: undefined,
        service_id: undefined,
      }),
    );

    expect(colonnes(grist.tables.Evenements)).toEqual([
      ['{"id":"e_chu_grenoble"}', '{"id":"s_grenoble_cardio"}'],
      [null, null],
    ]);
  });

  it("écrit en colonne le commit du serveur qui a reçu l'événement", async () => {
    grist = await demarrerGrist({});
    const journal = new GristJournal(
      new GristApiClient({ docUrl: grist.docUrl, cleApi: "test" }),
    );

    await journal.append(recu({}));
    await journal.setAside(recu({ service_id: "s_grenoble_pneumo" }));

    expect(grist.tables.Evenements?.[0]?.fields.commit_sha).toBe("f30aafe");
    expect(grist.tables.Collisions?.[0]?.fields.commit_sha).toBe("f30aafe");
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

  it("retrouve la mesure d'un document de la simulation, et seulement elle", async () => {
    grist = await demarrerGrist({});
    const journal = new GristJournal(
      new GristApiClient({ docUrl: grist.docUrl, cleApi: "test" }),
    );
    const mesure = (eventId: string, documentId: string) =>
      recu({
        event_id: eventId,
        type: "document_typography_measured",
        document_id: documentId,
      });
    await journal.append(recu({ event_id: "s-1:2", document_id: "d1" }));
    await journal.append(mesure("s-1:3", "d1"));
    await journal.append(mesure("s-1:4", "d2"));

    expect(await journal.findMeasurement("s-1", "d2")).toEqual(
      mesure("s-1:4", "d2"),
    );
    expect(await journal.findMeasurement("s-2", "d1")).toBeUndefined();
  });
});
