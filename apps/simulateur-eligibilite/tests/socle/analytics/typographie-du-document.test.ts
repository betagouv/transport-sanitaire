// La taille des textes imprimés du document R3 (ADR-12) : une mesure par
// version, liée à ses impressions par la version, sans aucun texte.

import { describe, expect, it } from "vitest";
import type { Typography } from "../../../front/socle/analytics/document-version.entity";
import { Journey } from "../../../front/socle/analytics/journey.entity";
import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event";
import { PROVENANCE } from "./journal-de-test";

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

// Un bon de commande : la quantité à 9 pt, l'adresse rapetissée à 7,5 pt.
const LU: Typography = { sizes: { quantite: 9, adresse: 7.5 }, unmeasured: [] };

const unDocument = (typography = LU) => ({
  file: "bon-de-commande-2026-11-13.pdf",
  dto: { fields: { quantite: "2", adresse: "1 rue des Lilas" }, drawings: {} },
  typography,
});

// Le R3 ouvert, son document prêt.
function afficherLeR3(journey: Journey, document = unDocument()) {
  journey.displayResult(unR2);
  journey.openAResultScreen("R3");
  return journey.displayDocument(document);
}

const mesures = (events: AnalyticsEvent[]) =>
  events.filter(({ type }) => type === "document_typography_measured");

describe("la taille des textes du document R3", () => {
  it("une version imprimée deux fois : une mesure, à 7,5 pt au plus petit, et deux champs", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    const affiche = afficherLeR3(journey);
    const imprimer = journey.exposeButtons(["document_print"]).exposures
      .document_print;
    if (!imprimer) throw new Error("Imprimer n'est pas exposé.");

    const impressions = [
      ...journey.press(imprimer, "requested"),
      ...journey.press(imprimer, "requested"),
    ];

    const [mesure, ...autres] = mesures(affiche);
    expect(autres).toEqual([]);
    expect(mesure).toMatchObject({
      screen: "R3",
      document_id: "d1",
      revision: "r1",
      support: "S3138g",
      status: "complete",
      fields: [
        { field_id: "quantite", font_size_pt: 9 },
        { field_id: "adresse", font_size_pt: 7.5 },
      ],
      unmeasured_field_ids: [],
    });
    const tailles = mesure?.fields?.map(({ font_size_pt }) => font_size_pt);
    expect(Math.min(...(tailles ?? []))).toBe(7.5);
    expect(impressions.map(({ document_id }) => document_id)).toEqual([
      "d1",
      "d1",
    ]);
  });

  it("une mesure partielle le dit, et nomme le champ sans taille", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

    const [mesure] = mesures(
      afficherLeR3(
        journey,
        unDocument({ sizes: { quantite: 9 }, unmeasured: ["adresse"] }),
      ),
    );

    expect(mesure).toMatchObject({
      status: "partial",
      fields: [{ field_id: "quantite", font_size_pt: 9 }],
      unmeasured_field_ids: ["adresse"],
    });
  });

  it("le même DTO imprimé autrement ouvre une nouvelle version, et sa mesure", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    afficherLeR3(journey);

    const [mesure] = mesures(
      journey.displayDocument(
        unDocument({ sizes: { quantite: 9, adresse: 7 }, unmeasured: [] }),
      ),
    );

    expect(mesure).toMatchObject({
      document_id: "d2",
      fields: [
        { field_id: "quantite", font_size_pt: 9 },
        { field_id: "adresse", font_size_pt: 7 },
      ],
    });
  });

  it("la même version réaffichée ne mesure pas une seconde fois", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    afficherLeR3(journey);

    expect(journey.displayDocument(unDocument())).toEqual([]);
  });

  it("la mesure ne porte aucun texte du document", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

    const [mesure] = mesures(afficherLeR3(journey));

    expect(JSON.stringify(mesure)).not.toContain("Lilas");
  });
});
