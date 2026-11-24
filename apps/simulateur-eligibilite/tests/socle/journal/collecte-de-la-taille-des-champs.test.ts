// @vitest-environment node
//
// La collecte de la taille des champs du document R3 (ANA22-03), sur le vrai
// serveur Express et le journal en mémoire : des identifiants fermés, propres
// au support, et une seule mesure par `document_id`.

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

// Une PMT mesurée en partie : l'adresse de départ, pas les éléments médicaux.
const mesure = {
  ...simulationStarted,
  event_id: "s-1:9",
  sequence: 9,
  type: "document_typography_measured",
  screen: "R3",
  revision: "r1",
  document_revision: "d1",
  document_id: "d1",
  support: "S3138g",
  expected_field_ids: [
    "S3138g.depart_adresse_native",
    "S3138g.elements_medicaux",
  ],
  field_measurements: [
    { field_id: "S3138g.depart_adresse_native", font_size_pt: 7.5 },
  ],
};

// La même mesure, envoyée de nouveau sous un autre `event_id`.
const rejouee = (champs: object = {}) => ({
  ...mesure,
  event_id: "s-1:10",
  sequence: 10,
  occurred_at: "2026-11-12T10:05:00.000+01:00",
  ...champs,
});

describe("collecte de la taille des champs du document R3", () => {
  it("garde les champs attendus et la taille de chaque champ mesuré", async () => {
    const journal = await collecteSur();

    const { status } = await collecter(mesure);

    expect(status).toBe(204);
    expect((await journal.find("s-1:9"))?.event).toEqual(mesure);
  });

  it("garde un document sans champ rempli", async () => {
    const journal = await collecteSur();
    const vide = { ...mesure, expected_field_ids: [], field_measurements: [] };

    const { status } = await collecter(vide);

    expect(status).toBe(204);
    expect((await journal.find("s-1:9"))?.event).toEqual(vide);
  });

  it.each([
    [
      "un texte saisi à la place d'un identifiant",
      {
        field_measurements: [
          { field_id: "M. Dupont, 1 rue des Lilas", font_size_pt: 9 },
        ],
      },
    ],
    [
      "la clé d'un champ dans notre DTO",
      { expected_field_ids: ["depart_structure"], field_measurements: [] },
    ],
    [
      "un champ d'un autre support",
      { expected_field_ids: ["S3141.periode_fin"], field_measurements: [] },
    ],
    [
      "un champ mesuré qui n'est pas attendu",
      { expected_field_ids: ["S3138g.nombre"] },
    ],
    [
      "un champ mesuré deux fois",
      {
        expected_field_ids: ["S3138g.depart_adresse_native"],
        field_measurements: [
          { field_id: "S3138g.depart_adresse_native", font_size_pt: 7.5 },
          { field_id: "S3138g.depart_adresse_native", font_size_pt: 8 },
        ],
      },
    ],
    [
      "un champ attendu deux fois",
      {
        expected_field_ids: [
          "S3138g.elements_medicaux",
          "S3138g.elements_medicaux",
        ],
        field_measurements: [],
      },
    ],
    [
      "une taille nulle",
      {
        field_measurements: [
          { field_id: "S3138g.depart_adresse_native", font_size_pt: 0 },
        ],
      },
    ],
    ["l'état d'une mesure d'avant", { status: "partial" }],
  ])("refuse %s", async (_, champs) => {
    const journal = await collecteSur();

    const { status } = await collecter({ ...mesure, ...champs });

    expect(status).toBe(400);
    expect(await journal.find("s-1:9")).toBeUndefined();
  });

  it("ignore la même mesure du même document, rejouée", async () => {
    const journal = await collecteSur();
    await collecter(mesure);

    const { status } = await collecter(rejouee());

    expect(status).toBe(204);
    expect(await journal.find("s-1:10")).toBeUndefined();
    expect(journal.collisions).toEqual([]);
  });

  it("met à part une autre mesure du même document", async () => {
    const journal = await collecteSur();
    await collecter(mesure);

    const { status } = await collecter(
      rejouee({
        field_measurements: [
          { field_id: "S3138g.depart_adresse_native", font_size_pt: 8 },
        ],
      }),
    );

    expect(status).toBe(409);
    expect(await journal.find("s-1:10")).toBeUndefined();
    expect(journal.collisions.map(({ event }) => event.event_id)).toEqual([
      "s-1:10",
    ]);
  });

  it("garde la mesure d'un autre document, ou d'une autre simulation", async () => {
    const journal = await collecteSur();
    await collecter(mesure);

    const autreDocument = rejouee({
      document_revision: "d2",
      document_id: "d2",
    });
    const autreSimulation = {
      ...mesure,
      event_id: "s-2:9",
      simulation_id: "s-2",
    };

    expect((await collecter(autreDocument)).status).toBe(204);
    expect((await collecter(autreSimulation)).status).toBe(204);
    expect(await journal.find("s-1:10")).toBeDefined();
    expect(await journal.find("s-2:9")).toBeDefined();
  });
});
