// @vitest-environment node
//
// Sans `JOURNAL_GRIST_DOC_URL`, en staging comme en développement, le serveur
// accepte les événements mais n'en garde aucun : la mémoire du serveur ne grossit
// pas avec le trafic. Voir docs/knowledge/adr/analytics.md, ADR-7.

import { describe, expect, it } from "vitest";
import { adaptersFor } from "../../../server/container.ts";
import { JournalEntry } from "../../../server/journal/journal-entry.entity.ts";
import { simulationStarted } from "./evenements.ts";

describe("le journal, sans doc Grist configuré", () => {
  it("ne garde aucun événement", async () => {
    const { journal } = adaptersFor({
      port: 3000,
      grist: undefined,
      journal: undefined,
      environment: "simulateur-staging",
    });

    await journal.append(
      JournalEntry.receivedNow(simulationStarted, "simulateur-staging"),
    );

    expect(await journal.find(simulationStarted.event_id)).toBeUndefined();
  });
});
