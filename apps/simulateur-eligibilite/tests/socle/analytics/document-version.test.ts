// Les versions du document R3 dans le parcours (ADR-10) : `d1`, `d2`…, qui
// viennent de la révision courante. Un échec n'en ouvre aucune.

import { describe, expect, it } from "vitest";
import { Journey } from "../../../front/socle/analytics/journey.entity";
import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event";

// Le R2 affiché : ses codes, sans motif ni portion.
const unR2 = {
  canComplete: true,
  codes: {
    issue: "ISSUE_PMT",
    mode: null,
    reasonCodes: [],
    support: "S3138g",
    financeur: null,
  },
  motifs: [],
  portions: [],
};

// La dernière page de P2 validée, ses réponses changées : le R2 tombe.
function modifierP2(journey: Journey) {
  journey.openAPage({
    id: "P2/prestation",
    part: "P2",
    first: false,
    last: false,
    questions: ["Q2.1"],
  });
  journey.validate({
    questions: ["Q2.1"],
    stillValidated: ["Q2.1"],
    nextPart: null,
    changed: true,
  });
}

// Le document d'un R3 : le nom de son fichier daté, et son DTO.
const unDocument = (quantite: string) => ({
  file: "bon-de-commande-2026-11-13.pdf",
  dto: { fields: { quantite }, drawings: {} },
});

// Les documents envoyés, en bref : le type, la version et la révision.
const documents = (envoyes: AnalyticsEvent[]) =>
  envoyes.map(
    ({ type, document_id, revision }) =>
      `${type} ${document_id ?? "-"} ${revision}`,
  );

describe("les versions du document R3", () => {
  it("un document prêt ouvre la version d1, avec la révision, le support et le mode du R2", () => {
    const journey = new Journey({ seeded: false });
    journey.displayResult({ ...unR2, codes: { ...unR2.codes, mode: "VSL" } });

    const [affiche] = journey.displayDocument(unDocument("2"));

    expect(affiche).toMatchObject({
      type: "document_displayed",
      screen: "R3",
      document_id: "d1",
      revision: "r1",
      support: "S3138g",
      mode: "VSL",
    });
  });

  it("le même document réaffiché garde sa version, et ne repart pas", () => {
    const journey = new Journey({ seeded: false });
    journey.displayResult(unR2);
    journey.displayDocument(unDocument("2"));

    expect(journey.displayDocument(unDocument("2"))).toEqual([]);
  });

  it("un document qui change, sans changer le R2, ouvre la version suivante", () => {
    const journey = new Journey({ seeded: false });
    journey.displayResult(unR2);
    journey.displayDocument(unDocument("2"));

    expect(documents(journey.displayDocument(unDocument("3")))).toEqual([
      "document_displayed d2 r1",
    ]);
  });

  it("le document d'une révision tombée ne vaut pas pour la suivante : le même contenu y ouvre une version", () => {
    const journey = new Journey({ seeded: false });
    journey.displayResult(unR2);
    journey.displayDocument(unDocument("2"));
    modifierP2(journey);

    const sansR2 = journey.displayDocument(unDocument("2"));
    journey.displayResult(unR2);
    const apres = journey.displayDocument(unDocument("2"));

    expect(sansR2).toEqual([]);
    expect(documents(apres)).toEqual(["document_displayed d2 r2"]);
  });

  it("chaque génération ratée part avec la révision et le support, sans ouvrir de version", () => {
    const journey = new Journey({ seeded: false });
    journey.displayResult(unR2);

    const echecs = [...journey.failADocument(), ...journey.failADocument()];
    const [affiche] = journey.displayDocument(unDocument("2"));

    expect(echecs).toEqual([
      expect.objectContaining({
        type: "document_generation_failed",
        screen: "R3",
        revision: "r1",
        support: "S3138g",
      }),
      expect.objectContaining({ type: "document_generation_failed" }),
    ]);
    expect(echecs[0]).not.toHaveProperty("document_id");
    expect(affiche?.document_id).toBe("d1");
  });

  it("sans R2 affiché, un document ne fait rien partir", () => {
    const journey = new Journey({ seeded: false });

    expect([
      ...journey.displayDocument(unDocument("2")),
      ...journey.failADocument(),
    ]).toEqual([]);
  });
});
