// @vitest-environment node
//
// L'adaptateur Grist du journal, contre un Grist en mémoire servi en HTTP : un
// événement écrit se relit tel quel, et une collision va dans sa table.

import { afterEach, describe, expect, it } from "vitest";
import { gristJournal } from "../../../server/journal/grist-journal.ts";
import { demarrerGrist, type GristDeTest } from "../server/grist-de-test.ts";
import { simulationStarted } from "./evenements.ts";

let grist: GristDeTest;
afterEach(() => grist.close());

const recu = (event: object) => ({
  event: { ...simulationStarted, ...event },
  receivedAt: "2026-11-12T09:00:01.000Z",
  environment: "staging",
  schemaVersion: 1,
});

describe("journal dans Grist", () => {
  it("relit l'événement écrit, et garde une collision à part", async () => {
    grist = await demarrerGrist({});
    const journal = gristJournal({ docUrl: grist.docUrl, cleApi: "test" });
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
