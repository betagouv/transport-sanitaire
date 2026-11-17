// @vitest-environment node
//
// La collecte vérifie l'établissement et le service de chaque événement contre
// le référentiel (ANA22-01, #506) : un id inconnu, ou un service hors de son
// établissement, va en quarantaine, et ne compte pas comme un événement valide.
// Sur le vrai serveur Express, le journal en mémoire et le référentiel snapshot,
// sans mock.

import { afterEach, describe, expect, it } from "vitest";
import { MemoryJournal } from "../../../server/journal/memory-journal.adapter.ts";
import {
  type Referentiel,
  snapshotReferentiel,
} from "../../../shared/referentiel.ts";
import { type AppDeTest, demarrer, postTo } from "../server/serveur-de-test.ts";
import { simulationStarted } from "./evenements.ts";

let app: AppDeTest;
afterEach(() => app.close());

describe("la collecte vérifie le rattachement d'un événement", () => {
  it("garde un événement dont l'établissement et le service sont au référentiel", async () => {
    const journal = await collecteSur();

    const { status } = await collecter(simulationStarted);

    expect(status).toBe(204);
    expect(await journal.find("s-1:1")).toBeDefined();
    expect(journal.quarantined).toEqual([]);
  });

  it("garde un événement sans rattachement : le référentiel n'a pas répondu", async () => {
    const journal = await collecteSur();
    const { establishment_id, service_id, ...sansRattachement } =
      simulationStarted;

    const { status } = await collecter(sansRattachement);

    expect(status).toBe(204);
    expect(await journal.find("s-1:1")).toBeDefined();
  });

  it("met en quarantaine un établissement inconnu, et le compte", async () => {
    const journal = await collecteSur();
    const inconnu = { ...simulationStarted, establishment_id: "e_inconnu" };

    const { status } = await collecter(inconnu);

    expect(status).toBe(422);
    expect(await journal.find("s-1:1")).toBeUndefined();
    expect(journal.quarantined).toEqual([
      {
        entry: expect.objectContaining({ event: inconnu }),
        reason: "unknown_establishment",
      },
    ]);
  });

  it("met en quarantaine un service d'un autre établissement", async () => {
    const journal = await collecteSur();

    const { status } = await collecter({
      ...simulationStarted,
      service_id: "s_chambery_urgences",
    });

    expect(status).toBe(422);
    expect(await journal.find("s-1:1")).toBeUndefined();
    expect(journal.quarantined.map((q) => q.reason)).toEqual([
      "service_outside_establishment",
    ]);
  });

  it("met en quarantaine un service inconnu", async () => {
    const journal = await collecteSur();

    await collecter({ ...simulationStarted, service_id: "s_inconnu" });

    expect(journal.quarantined.map((q) => q.reason)).toEqual([
      "service_outside_establishment",
    ]);
  });
});

describe("la collecte lit le référentiel en cache", () => {
  it("ne relit pas le référentiel à chaque événement", async () => {
    const { referentiel, lectures } = await referentielQuiCompte();
    await collecteSur(referentiel);

    for (const sequence of [1, 2, 3, 4, 5]) {
      await collecter({
        ...simulationStarted,
        event_id: `s-1:${sequence}`,
        sequence,
      });
    }

    expect(lectures).toEqual(["etablissements", "services e_chu_grenoble"]);
  });

  it("relit le référentiel pour un établissement qu'il ne connaît pas encore", async () => {
    const { referentiel, etablissements } = await referentielQuiCompte();
    const journal = await collecteSur(referentiel);
    await collecter(simulationStarted);

    // Un prescripteur saisit un établissement : le référentiel le crée.
    etablissements.push({ id: "e_cree", libelle: "CH de Voiron" });
    const { status } = await collecter({
      ...simulationStarted,
      event_id: "s-2:1",
      simulation_id: "s-2",
      establishment_id: "e_cree",
      service_id: undefined,
    });

    expect(status).toBe(204);
    expect(await journal.find("s-2:1")).toBeDefined();
  });

  it("répond 503 si le référentiel ne répond pas : le navigateur réessaie", async () => {
    const journal = await collecteSur({
      ...snapshotReferentiel,
      listerEtablissements: async () => {
        throw new Error("Grist ne répond pas");
      },
    });

    const { status } = await collecter(simulationStarted);

    expect(status).toBe(503);
    expect(await journal.find("s-1:1")).toBeUndefined();
    expect(journal.quarantined).toEqual([]);
  });
});

// ---- implémentation ----

async function collecteSur(referentiel: Referentiel = snapshotReferentiel) {
  const journal = new MemoryJournal();
  app = await demarrer(referentiel, { journal });
  return journal;
}

const collecter = (evenement: unknown) =>
  postTo(app.base, "/api/journal/v1/events", evenement);

// Le snapshot, dont on lit chaque lecture, et dont on peut compléter la liste
// des établissements.
async function referentielQuiCompte() {
  const lectures: string[] = [];
  const etablissements = [
    ...(await snapshotReferentiel.listerEtablissements()),
  ];
  const referentiel: Referentiel = {
    async listerEtablissements() {
      lectures.push("etablissements");
      return etablissements;
    },
    async listerServices(etabId) {
      lectures.push(`services ${etabId}`);
      return snapshotReferentiel.listerServices(etabId);
    },
  };
  return { referentiel, lectures, etablissements };
}
