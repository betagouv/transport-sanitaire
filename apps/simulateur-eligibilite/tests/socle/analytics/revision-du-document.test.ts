// La révision du document R3 (R13 du référentiel v10.2.1, contrat v10.2.2) :
// `dr1`, `dr2`… Elle change quand une page de P3 validée change les réponses,
// et `document_invalidated` annonce la nouvelle, avec la révision du R2. La
// version du document, `d1`, `d2`…, change dès que le PDF change, même rendu
// autrement sous la même révision.

import { describe, expect, it } from "vitest";
import type { Journey } from "../../../front/socle/analytics/journey.entity";
import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event";
import {
  afficherLeR3,
  BOUTONS_DU_DOCUMENT,
  unDocument,
  unParcours,
} from "./parcours-des-boutons";

// La page du complément ouverte puis validée, ses réponses changées ou non.
function validerP3(journey: Journey, changed: boolean) {
  journey.openAPage({
    id: "P3/complement",
    part: "P3",
    first: true,
    last: true,
    questions: ["Q3.1"],
  });
  return journey.validate({ questions: ["Q3.1"], nextPart: null, changed });
}

// Revient au R3, son document prêt, et ses boutons exposés.
function revenirAuR3(journey: Journey, quantite: string) {
  journey.openAResultScreen("R3");
  return [
    ...journey.displayDocument(unDocument(quantite)),
    ...journey.exposeButtons(BOUTONS_DU_DOCUMENT),
  ];
}

// Les événements du document, en bref : le type, la version et la révision.
const enBref = (events: AnalyticsEvent[]) =>
  events
    .filter(({ type }) => type.startsWith("document_"))
    .map(
      ({ type, document_id, document_revision }) =>
        `${type} ${document_id ?? "-"} ${document_revision}`,
    );

describe("la révision du document R3", () => {
  it("le premier document porte la révision dr1, distincte de sa version d1", () => {
    const journey = unParcours();
    afficherLeR3(journey);

    expect(enBref(journey.requestDocument("print"))).toEqual([
      "document_print_requested d1 dr1",
    ]);
  });

  it("une page de P3 qui change les réponses annonce la révision attendue, avec celle du R2", () => {
    const journey = unParcours();
    afficherLeR3(journey);

    const validation = validerP3(journey, true);

    expect(validation).toContainEqual(
      expect.objectContaining({
        type: "document_invalidated",
        screen: "P3",
        revision: "r1",
        document_revision: "dr2",
      }),
    );
    expect(enBref(revenirAuR3(journey, "3"))).toEqual([
      "document_displayed d2 dr2",
      "document_typography_measured d2 dr2",
    ]);
  });

  it("revalider P3 sans rien changer n'invalide pas le document", () => {
    const journey = unParcours();
    afficherLeR3(journey);

    expect(enBref(validerP3(journey, false))).toEqual([]);
  });

  it("avant tout document affiché, P3 changé n'a rien à invalider", () => {
    const journey = unParcours();
    journey.displayResult({
      canComplete: true,
      codes: {
        issue: "ISSUE_PMT",
        mode: null,
        transportComposition: "unknown",
        reasonCodes: [],
        support: "S3138g",
      },
    });

    expect(enBref(validerP3(journey, true))).toEqual([]);
  });

  it("le même PDF après un changement de P3 part en nouvelle version, sous la nouvelle révision", () => {
    const journey = unParcours();
    afficherLeR3(journey, "2");
    validerP3(journey, true);

    expect(enBref(revenirAuR3(journey, "2"))).toEqual([
      "document_displayed d2 dr2",
      "document_typography_measured d2 dr2",
    ]);
  });

  it("les boutons du document portent sa version et sa révision", () => {
    const journey = unParcours();
    afficherLeR3(journey);
    validerP3(journey, true);

    const exposes = revenirAuR3(journey, "3").filter(
      ({ type }) => type === "button_exposed",
    );

    expect(exposes).toContainEqual(
      expect.objectContaining({
        button_id: "document_print",
        artifact_id: "d2",
        document_id: "d2",
        document_revision: "dr2",
      }),
    );
  });
});
