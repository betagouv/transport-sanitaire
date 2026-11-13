// @vitest-environment node
//
// La route de collecte du journal des parcours, sur le vrai serveur Express et
// le journal en mémoire, sans mock. Voir docs/knowledge/adr/analytics.md, ADR-6
// et ADR-7.

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
      schemaVersion: 2,
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

describe("collecte du chargement de la page", () => {
  it("garde le chargement d'une page rechargée", async () => {
    const journal = await collecteSur();
    const recharge = { ...simulationStarted, navigation: "reload" };

    const { status } = await collecter(recharge);

    expect(status).toBe(204);
    expect((await journal.find("s-1:1"))?.event).toEqual(recharge);
  });

  it("refuse un chargement que le contrat ne connaît pas", async () => {
    await collecteSur();

    const { status } = await collecter({
      ...simulationStarted,
      navigation: "prerender",
    });

    expect(status).toBe(400);
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

describe("collecte de la taille des champs du document R3", () => {
  const mesure = {
    ...simulationStarted,
    event_id: "s-1:9",
    sequence: 9,
    type: "document_typography_measured",
    screen: "R3",
    revision: "r1",
    document_id: "d1",
    status: "partial",
    fields: [{ field_id: "depart_structure", font_size_pt: 7.5 }],
    unmeasured_field_ids: ["motif"],
  };

  it("garde la clé et la taille de chaque champ", async () => {
    const journal = await collecteSur();

    const { status } = await collecter(mesure);

    expect(status).toBe(204);
    expect((await journal.find("s-1:9"))?.event).toEqual(mesure);
  });

  it("refuse un texte saisi à la place de la clé d'un champ", async () => {
    const journal = await collecteSur();

    const { status } = await collecter({
      ...mesure,
      fields: [{ field_id: "M. Dupont, 1 rue des Lilas", font_size_pt: 9 }],
    });

    expect(status).toBe(400);
    expect(await journal.find("s-1:9")).toBeUndefined();
  });
});

describe("collecte des portions du premier résultat", () => {
  const affichage = {
    ...simulationStarted,
    event_id: "s-1:5",
    sequence: 5,
    type: "result_displayed",
    screen: "R2",
    revision: "r1",
    portions: ["LIGNE_REGULIERE"],
  };

  it("garde la ligne régulière", async () => {
    const journal = await collecteSur();

    const { status } = await collecter(affichage);

    expect(status).toBe(204);
    expect((await journal.find("s-1:5"))?.event).toEqual(affichage);
  });

  it("reçoit l'envoi d'un onglet d'avant #443, sans la partie terrestre qu'il croyait prouvée", async () => {
    const journal = await collecteSur();

    const { status } = await collecter({
      ...affichage,
      portions: ["LIGNE_REGULIERE", "TERRESTRE"],
    });

    expect(status).toBe(204);
    expect((await journal.find("s-1:5"))?.event).toEqual(affichage);
  });
});
