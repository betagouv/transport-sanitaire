// Les versions du document R3 dans le parcours (ADR-0046) : `d1`, `d2`…, qui
// viennent de la révision courante. Un échec n'en ouvre aucune.

import { describe, expect, it } from "vitest";
import { Journey } from "../../../front/socle/analytics/journey.entity";
import type {
  AnalyticsEvent,
  Mode,
  TransportComposition,
} from "../../../shared/analytics/analytics-event";
import { PROVENANCE } from "./journal-de-test";

// Le R2 affiché : ses codes, sans motif.
const unR2 = {
  canComplete: true,
  codes: {
    issue: "ISSUE_PMT",
    mode: null,
    transportComposition: "unknown",
    reasonCodes: [],
    support: "S3138g",
    financeur: null,
  },
  motifs: [],
} as const;

// Un R2 de cette composition du transport, et de ce mode terrestre.
const unR2Compose = (
  transportComposition: TransportComposition,
  mode: Mode | null,
) => ({ ...unR2, codes: { ...unR2.codes, transportComposition, mode } });

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
  typography: { sizes: { quantite: 9 }, unmeasured: [] },
});

// Les documents envoyés, en bref : le type, la version et la révision. Leur
// mesure typographique a ses propres tests.
const documents = (envoyes: AnalyticsEvent[]) =>
  envoyes
    .filter(({ type }) => type !== "document_typography_measured")
    .map(
      ({ type, document_id, revision }) =>
        `${type} ${document_id ?? "-"} ${revision}`,
    );

describe("les versions du document R3", () => {
  it("un document prêt ouvre la version d1, avec la révision, le support, la composition et le mode du R2", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    journey.displayResult(unR2Compose("mixed", "TAP"));

    const [affiche] = journey.displayDocument(unDocument("2"));

    expect(affiche).toMatchObject({
      type: "document_displayed",
      screen: "R3",
      document_id: "d1",
      revision: "r1",
      support: "S3138g",
      transport_composition: "mixed",
      mode: "TAP",
    });
  });

  it("un document garde la composition de son propre R2, pas celle d'un R2 plus récent", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    journey.displayResult(unR2Compose("mixed", "TAP"));
    const [premier] = journey.displayDocument(unDocument("2"));
    journey.displayResult(unR2Compose("regular_line_only", null));
    const [meme] = journey.displayDocument(unDocument("3"));
    modifierP2(journey);
    journey.displayResult(unR2Compose("regular_line_only", null));
    const [suivant] = journey.displayDocument(unDocument("3"));

    expect([premier, meme, suivant]).toEqual([
      expect.objectContaining({
        document_id: "d1",
        transport_composition: "mixed",
        mode: "TAP",
      }),
      expect.objectContaining({
        document_id: "d2",
        transport_composition: "mixed",
        mode: "TAP",
      }),
      expect.objectContaining({
        document_id: "d3",
        revision: "r2",
        transport_composition: "regular_line_only",
      }),
    ]);
    expect(suivant).not.toHaveProperty("mode");
  });

  it("le même document réaffiché garde sa version, et ne repart pas", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    journey.displayResult(unR2);
    journey.displayDocument(unDocument("2"));

    expect(journey.displayDocument(unDocument("2"))).toEqual([]);
  });

  it("un document qui change, sans changer le R2, ouvre la version suivante", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    journey.displayResult(unR2);
    journey.displayDocument(unDocument("2"));

    expect(documents(journey.displayDocument(unDocument("3")))).toEqual([
      "document_displayed d2 r1",
    ]);
  });

  it("le document d'une révision tombée ne vaut pas pour la suivante : le même contenu y ouvre une version", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
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
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
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
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

    expect([
      ...journey.displayDocument(unDocument("2")),
      ...journey.failADocument(),
    ]).toEqual([]);
  });
});
