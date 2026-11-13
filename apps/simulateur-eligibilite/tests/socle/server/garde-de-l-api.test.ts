// @vitest-environment node
//
// La garde de l'API (#451), sur le vrai serveur Express, sans mock : l'origine
// d'une écriture, son débit par IP, sa taille.

import { afterEach, describe, expect, it } from "vitest";
import type { WriteLimits } from "../../../server/protect-the-api.ts";
import { LONGUEUR_MAX_D_UN_NOM } from "../../../shared/rattachement-saisi.ts";
import { snapshotReferentiel } from "../../../shared/referentiel.ts";
import { simulationStarted } from "../journal/evenements.ts";
import { type AppDeTest, demarrer, postTo } from "./serveur-de-test.ts";

let app: AppDeTest;
afterEach(() => app.close());

async function serveur(writeLimits?: WriteLimits) {
  app = await demarrer(snapshotReferentiel, { writeLimits });
}

const SELECTION = { etabId: "e_chu_grenoble", serviceId: "s_grenoble_cardio" };

const rattacher = (body: unknown, headers?: Record<string, string>) =>
  postTo(app.base, "/api/rattachement", body, headers);

describe("origine d'une écriture", () => {
  it("refuse un POST venu d'un autre site", async () => {
    await serveur();

    const { status } = await rattacher(SELECTION, {
      Origin: "https://ailleurs.example",
    });

    expect(status).toBe(403);
  });

  it("refuse un POST d'origine `null`", async () => {
    await serveur();

    const { status } = await rattacher(SELECTION, { Origin: "null" });

    expect(status).toBe(403);
  });

  it("accepte un POST venu du simulateur lui-même", async () => {
    await serveur();

    const { status } = await rattacher(SELECTION, { Origin: app.base });

    expect(status).toBe(204);
  });
});

describe("débit par IP", () => {
  it("refuse un rattachement de trop dans la minute", async () => {
    await serveur({ rattachement: 2, journal: 2 });

    await rattacher(SELECTION);
    await rattacher(SELECTION);
    const { status, body } = await rattacher(SELECTION);

    expect(status).toBe(429);
    expect(body).toEqual({ error: "trop de requêtes" });
  });

  it("refuse un événement de trop dans la minute", async () => {
    await serveur({ rattachement: 2, journal: 2 });
    const collecter = (sequence: number) =>
      postTo(app.base, "/api/journal/v1/events", {
        ...simulationStarted,
        event_id: `s-1:${sequence}`,
        sequence,
      });

    await collecter(1);
    await collecter(2);
    const { status } = await collecter(3);

    expect(status).toBe(429);
  });
});

describe("taille d'une écriture", () => {
  it("refuse un corps de plus de 32 ko", async () => {
    await serveur();

    const res = await fetch(`${app.base}/api/journal/v1/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bourrage: "x".repeat(40_000) }),
    });

    expect(res.status).toBe(413);
  });

  it("refuse un nom de service saisi trop long", async () => {
    await serveur();

    const { status, body } = await rattacher({
      ...SELECTION,
      serviceEstAutre: true,
      serviceLibre: "x".repeat(LONGUEUR_MAX_D_UN_NOM + 1),
    });

    expect(status).toBe(400);
    expect(body).toEqual({ error: "nom saisi trop long" });
  });
});
