// La taille des textes imprimés du document R3 (ADR-0048, ANA22-03) : une
// mesure par version, sous les identifiants fermés de son support, liée à ses
// impressions par la version, sans aucun texte.

import { describe, expect, it } from "vitest";
import type { Typography } from "../../../front/socle/analytics/document-version.entity";
import { Journey } from "../../../front/socle/analytics/journey.entity";
import type {
  AnalyticsEvent,
  Support,
} from "../../../shared/analytics/analytics-event";
import { PROVENANCE } from "./journal-de-test";

// Le R2 affiché d'une PMT : ses codes, sans motif.
const unR2 = (support: Support = "S3138g") => ({
  canComplete: true,
  codes: {
    issue: "ISSUE_PMT" as const,
    mode: null,
    transportComposition: "unknown" as const,
    reasonCodes: [],
    support,
  },
});

// Une PMT : le nombre de transports à 9 pt, l'adresse d'arrivée rapetissée à
// 7,5 pt.
const LU: Typography = {
  sizes: { "S3138g.nombre": 9, "S3138g.arrivee_adresse_native": 7.5 },
  unmeasured: [],
};

const unDocument = (typography = LU) => ({
  file: "prescription-medicale-de-transport-2026-11-17.pdf",
  dto: {
    fields: { nombre: "2", arrivee_structure: "Centre de dialyse, Lyon" },
    drawings: {},
  },
  typography,
});

// Le R3 ouvert, son document prêt.
function afficherLeR3(journey: Journey, document = unDocument(), r2 = unR2()) {
  journey.displayResult(r2);
  journey.openAResultScreen("R3");
  return journey.displayDocument(document);
}

const mesures = (events: AnalyticsEvent[]) =>
  events.filter(({ type }) => type === "document_typography_measured");

describe("la taille des textes du document R3", () => {
  it("une version imprimée deux fois : une mesure, sous les identifiants de son support", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    const affiche = afficherLeR3(journey);

    const impressions = [
      ...journey.requestDocument("print"),
      ...journey.requestDocument("print"),
    ];

    expect(mesures(affiche)).toEqual([
      expect.objectContaining({
        screen: "R3",
        revision: "r1",
        document_revision: "dr1",
        document_id: "d1",
        support: "S3138g",
        expected_field_ids: ["S3138g.nombre", "S3138g.arrivee_adresse_native"],
        field_measurements: [
          { field_id: "S3138g.nombre", font_size_pt: 9 },
          { field_id: "S3138g.arrivee_adresse_native", font_size_pt: 7.5 },
        ],
      }),
    ]);
    expect(mesures(affiche)[0]).not.toHaveProperty("status");
    expect(impressions.map(({ document_id }) => document_id)).toEqual([
      "d1",
      "d1",
    ]);
  });

  it("part avec l'affichage de la version, avant tout clic", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

    const types = afficherLeR3(journey).map(({ type }) => type);

    expect(types).toEqual([
      "document_displayed",
      "document_typography_measured",
    ]);
  });

  it("une mesure partielle attend le champ sans taille, sans le mesurer", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

    const [mesure] = mesures(
      afficherLeR3(
        journey,
        unDocument({
          sizes: { "S3138g.nombre": 9 },
          unmeasured: ["S3138g.arrivee_adresse_native"],
        }),
      ),
    );

    expect(mesure).toMatchObject({
      expected_field_ids: ["S3138g.nombre", "S3138g.arrivee_adresse_native"],
      field_measurements: [{ field_id: "S3138g.nombre", font_size_pt: 9 }],
    });
  });

  it("un document sans champ rempli part, sans champ attendu ni mesuré", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

    const [mesure] = mesures(
      afficherLeR3(journey, unDocument({ sizes: {}, unmeasured: [] })),
    );

    expect(mesure).toMatchObject({
      expected_field_ids: [],
      field_measurements: [],
    });
  });

  it("sans support de document, la mesure ne part pas", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

    const affiche = afficherLeR3(journey, unDocument(), unR2("AUCUN"));

    expect(mesures(affiche)).toEqual([]);
  });

  it("le même DTO imprimé autrement ouvre une nouvelle version, et sa mesure, sous la même révision du document", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    afficherLeR3(journey);

    const [mesure] = mesures(
      journey.displayDocument(
        unDocument({
          sizes: { "S3138g.nombre": 9, "S3138g.arrivee_adresse_native": 7 },
          unmeasured: [],
        }),
      ),
    );

    expect(mesure).toMatchObject({
      document_revision: "dr1",
      document_id: "d2",
      field_measurements: [
        { field_id: "S3138g.nombre", font_size_pt: 9 },
        { field_id: "S3138g.arrivee_adresse_native", font_size_pt: 7 },
      ],
    });
  });

  it("la même version réaffichée ne mesure pas une seconde fois", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    afficherLeR3(journey);

    expect(journey.displayDocument(unDocument())).toEqual([]);
  });

  it("la mesure ne porte ni texte ni longueur de texte du document", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

    const [mesure] = mesures(afficherLeR3(journey));

    expect(JSON.stringify(mesure)).not.toContain("dialyse");
    for (const champ of mesure?.field_measurements ?? [])
      expect(Object.keys(champ)).toEqual(["field_id", "font_size_pt"]);
  });
});
