// @vitest-environment node
//
// Sans `SCALINGO_POSTGRESQL_URL`, en staging comme en développement, le serveur
// accepte les événements mais n'en garde aucun : la mémoire du serveur ne
// grossit pas avec le trafic.

import { describe, expect, it } from "vitest";
import { adaptersFor } from "../../../server/container.ts";
import { JournalEntry } from "../../../server/journal/journal-entry.entity.ts";
import { BUILD, simulationStarted } from "./evenements.ts";

describe("le journal, sans base configurée", () => {
  it("ne garde aucun événement", async () => {
    const { journal } = adaptersFor({
      port: 3000,
      grist: undefined,
      journal: undefined,
      journalReadToken: undefined,
      environment: "simulateur-staging",
      build: BUILD,
    });

    await journal.append(
      JournalEntry.receivedNow(
        simulationStarted,
        "simulateur-staging",
        "f30aafe",
      ),
    );

    expect(await journal.find(simulationStarted.event_id)).toBeUndefined();
  });
});
