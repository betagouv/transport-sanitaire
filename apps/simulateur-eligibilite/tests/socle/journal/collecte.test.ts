// @vitest-environment node
//
// La route de collecte du journal des parcours, sur le vrai serveur Express et
// le journal en mémoire, sans mock. Voir docs/knowledge/adr/analytics.md, ADR-6
// et ADR-7.

import { afterEach, describe, expect, it } from "vitest";
import { memoryJournal } from "../../../server/journal/memory-journal.ts";
import { snapshotReferentiel } from "../../../shared/referentiel.ts";
import { type AppDeTest, demarrer, postTo } from "../server/serveur-de-test.ts";
import { simulationStarted } from "./evenements.ts";

let app: AppDeTest;
afterEach(() => app.close());

async function collecteSur(journal = memoryJournal()) {
  app = await demarrer(snapshotReferentiel, { journal });
  return journal;
}

const collecter = (evenement: unknown) =>
  postTo(app.base, "/api/journal/v1/events", evenement);

describe("collecte d'un événement", () => {
  it("conserve l'événement, avec ce que le serveur sait de sa réception", async () => {
    const journal = await collecteSur();

    const { status } = await collecter(simulationStarted);

    expect(status).toBe(204);
    expect(await journal.find("s-1:1")).toEqual({
      event: simulationStarted,
      receivedAt: expect.stringMatching(/^\d{4}-\d\d-\d\dT/),
      environment: "test",
      schemaVersion: 1,
    });
  });

  it("ignore le renvoi d'un événement déjà reçu", async () => {
    const journal = await collecteSur();
    await collecter(simulationStarted);
    const premier = await journal.find("s-1:1");

    const { status } = await collecter(simulationStarted);

    expect(status).toBe(204);
    expect(await journal.find("s-1:1")).toEqual(premier);
    expect(journal.collisions).toEqual([]);
  });

  it("met à part un autre événement qui reprend le même identifiant", async () => {
    const journal = await collecteSur();
    await collecter(simulationStarted);
    const autre = { ...simulationStarted, service_id: "s_grenoble_pneumo" };

    const { status } = await collecter(autre);

    expect(status).toBe(409);
    expect((await journal.find("s-1:1"))?.event).toEqual(simulationStarted);
    expect(journal.collisions.map((c) => c.event)).toEqual([autre]);
  });

  it("refuse un champ hors contrat, sans rien écrire", async () => {
    const journal = await collecteSur();

    const { status } = await collecter({
      ...simulationStarted,
      reponse: "domicile",
    });

    expect(status).toBe(400);
    expect(await journal.find("s-1:1")).toBeUndefined();
  });
});
