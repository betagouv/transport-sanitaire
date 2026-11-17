// @vitest-environment node
//
// La route de collecte du journal des parcours, sur le vrai serveur Express et
// le journal en mémoire, sans mock. Voir ADR-0042
// et ADR-0043.

import { afterEach, describe, expect, it } from "vitest";
import { MemoryJournal } from "../../../server/journal/memory-journal.adapter.ts";
import { snapshotReferentiel } from "../../../shared/referentiel.ts";
import { type AppDeTest, demarrer, postTo } from "../server/serveur-de-test.ts";
import { simulationStarted } from "./evenements.ts";

let app: AppDeTest;
afterEach(() => app.close());

async function collecteSur(journal = new MemoryJournal()) {
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
      schemaVersion: 3,
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

describe("collecte de la provenance d'un événement", () => {
  it("garde un événement d'un build sans commit connu", async () => {
    const journal = await collecteSur();
    const sansCommit = { ...simulationStarted, commit_sha: "inconnu" };

    const { status } = await collecter(sansCommit);

    expect(status).toBe(204);
    expect((await journal.find("s-1:1"))?.event).toEqual(sansCommit);
  });

  it.each([
    ["sans version de l'app", { app_version: undefined }],
    ["sans commit", { commit_sha: undefined }],
    ["avec une version des règles qui n'en est pas une", { version: "v10" }],
    ["avec une version de l'app qui n'en est pas une", { app_version: "0.8" }],
    ["avec un commit qui n'en est pas un", { commit_sha: "main" }],
  ])("refuse un événement %s", async (_, provenance) => {
    await collecteSur();

    const { status } = await collecter({ ...simulationStarted, ...provenance });

    expect(status).toBe(400);
  });
});

describe("collecte d'une simulation sans début", () => {
  it("garde un événement dont la simulation n'a pas de début : l'historique se lit incomplet", async () => {
    const journal = await collecteSur();
    const intention = {
      ...simulationStarted,
      event_id: "s-sans-p0:2",
      simulation_id: "s-sans-p0",
      sequence: 2,
      type: "intent_selected",
      intent: "eligibilite_seule",
    };

    const { status } = await collecter(intention);

    expect(status).toBe(204);
    expect((await journal.find("s-sans-p0:2"))?.event).toEqual(intention);
  });
});

describe("collecte de la composition du transport", () => {
  const affichage = {
    ...simulationStarted,
    event_id: "s-1:5",
    sequence: 5,
    type: "result_displayed",
    screen: "R2",
    revision: "r1",
    support: "S3139h",
    transport_composition: "mixed",
    mode: "TAP",
  };

  it("garde la composition et le mode terrestre", async () => {
    const journal = await collecteSur();

    const { status } = await collecter(affichage);

    expect(status).toBe(204);
    expect((await journal.find("s-1:5"))?.event).toEqual(affichage);
  });

  it.each([
    [
      "une composition que le contrat ne connaît pas",
      { transport_composition: "air_only" },
    ],
    ["un mode qui n'est pas terrestre", { mode: "AVION" }],
  ])("refuse %s", async (_, champ) => {
    await collecteSur();

    const { status } = await collecter({ ...affichage, ...champ });

    expect(status).toBe(400);
  });

  it("reçoit l'envoi d'un onglet d'avant #509, sans ses portions", async () => {
    const journal = await collecteSur();
    const { transport_composition: _, ...avant } = affichage;

    const { status } = await collecter({
      ...avant,
      portions: ["LIGNE_REGULIERE", "TERRESTRE"],
    });

    expect(status).toBe(204);
    const recu = (await journal.find("s-1:5"))?.event;
    expect(recu).toEqual(avant);
    expect(recu).not.toHaveProperty("portions");
  });
});
