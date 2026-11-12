// @vitest-environment node
//
// L'adaptateur Grist du journal, contre un Grist en mémoire servi en HTTP : un
// événement écrit se relit tel quel, et une collision va dans sa table.

import { afterEach, describe, expect, it } from "vitest";
import { GristApiClient } from "../../../server/grist/grist-api.client.ts";
import { GristJournal } from "../../../server/journal/grist-journal.adapter.ts";
import { JournalEntry } from "../../../server/journal/journal-entry.entity.ts";
import { demarrerGrist, type GristDeTest } from "../server/grist-de-test.ts";
import { simulationStarted } from "./evenements.ts";

let grist: GristDeTest;
afterEach(() => grist.close());

const recu = (event: object) =>
  new JournalEntry(
    { ...simulationStarted, ...event },
    "2026-11-12T09:00:01.000Z",
    "staging",
    1,
  );

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
});
