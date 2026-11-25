// @vitest-environment node
//
// L'écriture de la saisie libre dans le référentiel, et les ids qu'elle donne au
// parcours. Chaque cas démarre sa propre app, avec un référentiel injecté : un
// double qui capture, un en panne, ou le snapshot, qui n'écrit pas.

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { RattachementSaisi } from "../../../shared/rattachement-saisi.vo.ts";
import type { Referentiel } from "../../../shared/referentiel.port.ts";
import { snapshotReferentiel } from "../../../shared/snapshot-referentiel.adapter.ts";
import { demarrer, postTo } from "./serveur-de-test.ts";

const SERVICE_SAISI = {
  etabId: "e_chu_grenoble",
  serviceId: "s_grenoble_autre",
  serviceEstAutre: true,
  serviceLibre: "Néphrologie",
};

describe("POST /api/rattachement : enrichissement du référentiel", () => {
  // Référentiel double : lit le snapshot, capture les appels d'enrichissement,
  // et donne les ids d'un service créé.
  const appels: RattachementSaisi[] = [];
  const referentiel: Referentiel = {
    ...snapshotReferentiel,
    async enrichirDepuisSaisie(sel) {
      appels.push(sel);
      return { etabId: sel.etabId || "e_cree", serviceId: "s_cree" };
    },
  };

  let base: string;
  let close: () => Promise<void>;
  beforeAll(async () => ({ base, close } = await demarrer(referentiel)));
  afterAll(() => close());
  beforeEach(() => {
    appels.length = 0;
  });

  it("service « Autre » : enregistre le service saisi et donne son id", async () => {
    const { status, body } = await postTo(
      base,
      "/api/rattachement",
      SERVICE_SAISI,
    );

    expect(status).toBe(200);
    expect(body).toEqual({ etabId: "e_chu_grenoble", serviceId: "s_cree" });
    expect(appels).toEqual([SERVICE_SAISI]);
  });

  it("établissement saisi : enregistre l'établissement et son service, et donne leurs ids", async () => {
    const sel = {
      etabId: "",
      etabEstAutre: true,
      etabLibre: "CH de Voiron",
      serviceLibre: "Urgences",
    };

    const { status, body } = await postTo(base, "/api/rattachement", sel);

    expect(status).toBe(200);
    expect(body).toEqual({ etabId: "e_cree", serviceId: "s_cree" });
    expect(appels).toEqual([sel]);
  });

  it("refuse un établissement saisi sans nom de service", async () => {
    const { status } = await postTo(base, "/api/rattachement", {
      etabId: "",
      etabEstAutre: true,
      etabLibre: "CH de Voiron",
    });
    expect(status).toBe(400);
    expect(appels).toEqual([]);
  });

  it("refuse une sélection issue des listes : elle n'a rien à enregistrer", async () => {
    const { status, body } = await postTo(base, "/api/rattachement", {
      etabId: "e_chu_grenoble",
      serviceId: "s_grenoble_cardio",
    });

    expect(status).toBe(400);
    expect(body.error).toMatch(/rien à enregistrer/);
    expect(appels).toEqual([]);
  });
});

describe("POST /api/rattachement : référentiel muet", () => {
  it("répond 502 si l'enregistrement échoue", async () => {
    const { status } = await rattacherSur({
      ...snapshotReferentiel,
      async enrichirDepuisSaisie() {
        throw new Error("Grist indisponible");
      },
    });

    expect(status).toBe(502);
  });

  it("répond 503 si la source n'enregistre rien (snapshot, sans Grist)", async () => {
    const { status } = await rattacherSur(snapshotReferentiel);

    expect(status).toBe(503);
  });
});

// ---- implémentation ----

async function rattacherSur(referentiel: Referentiel) {
  const app = await demarrer(referentiel);
  try {
    return await postTo(app.base, "/api/rattachement", SERVICE_SAISI);
  } finally {
    await app.close();
  }
}
