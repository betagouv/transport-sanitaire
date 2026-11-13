// Les boutons exposés sur les écrans de résultat, et leurs clics (ADR-11) : une
// exposition par affichage et par version de son objet, et chaque clic garde
// celle du bouton cliqué.

import { describe, expect, it } from "vitest";
import type { Button } from "../../../front/socle/analytics/button-exposure.entity";
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

const unDocument = (quantite: string) => ({
  file: "bon-de-commande-2026-11-13.pdf",
  dto: { fields: { quantite }, drawings: {} },
  typography: { sizes: { quantite: 9 }, unmeasured: [] },
});

const BOUTONS_DE_LA_FICHE: Button[] = ["sheet_print", "sheet_download"];
const BOUTONS_DU_DOCUMENT: Button[] = [
  "document_print",
  "document_download",
  "feedback",
];

// Un affichage du R2, le résultat montré, et ses boutons exposés.
function afficherLeR2(journey: Journey, buttons = BOUTONS_DE_LA_FICHE) {
  journey.openAResultScreen("R2");
  journey.displayResult(unR2);
  return journey.exposeButtons(buttons);
}

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

// Les événements des boutons, en bref.
const enBref = (events: AnalyticsEvent[]) =>
  events.map(
    ({ type, action, exposure_id }) =>
      `${type}${action ? `/${action}` : ""} ${exposure_id}`,
  );

describe("les boutons exposés", () => {
  it("le R2 expose les boutons de sa fiche, avec l'écran, l'affichage, la révision et la version f1", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

    const { events } = afficherLeR2(journey);

    const vue = `${journey.simulationId}:v1`;
    expect(events).toEqual([
      expect.objectContaining({
        type: "action_exposed",
        action: "print",
        screen: "R2",
        page_view_id: vue,
        exposure_id: `${vue}:sheet_print:f1`,
        revision: "r1",
        sheet_id: "f1",
      }),
      expect.objectContaining({
        type: "action_exposed",
        action: "download",
        exposure_id: `${vue}:sheet_download:f1`,
        sheet_id: "f1",
      }),
    ]);
  });

  it("deux affichages et deux clics sur le premier : 1/1 par simulation, 1/2 par affichage", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    const premier = afficherLeR2(journey, ["sheet_print"]);
    const second = afficherLeR2(journey, ["sheet_print"]);
    const imprimer = premier.exposures.sheet_print;
    if (!imprimer) throw new Error("Imprimer n'est pas exposé.");

    const clics = [
      ...journey.press(imprimer, "requested"),
      ...journey.press(imprimer, "requested"),
    ];

    // Ce que comptent les indicateurs : des simulations, puis des expositions.
    const exposees = [...premier.events, ...second.events];
    const distincts = (events: AnalyticsEvent[], cle: keyof AnalyticsEvent) =>
      new Set(events.map((event) => event[cle])).size;
    expect(distincts(clics, "simulation_id")).toBe(1);
    expect(distincts(exposees, "simulation_id")).toBe(1);
    expect(distincts(clics, "exposure_id")).toBe(1);
    expect(distincts(exposees, "exposure_id")).toBe(2);
  });

  it("un clic sur un ancien affichage reste le sien, pas celui ouvert depuis", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    const ancien = afficherLeR2(journey).exposures.sheet_print;
    afficherLeR2(journey);
    if (!ancien) throw new Error("Imprimer n'est pas exposé.");

    const [clic] = journey.press(ancien, "requested");

    expect(clic).toMatchObject({
      type: "sheet_print_requested",
      screen: "R2",
      page_view_id: `${journey.simulationId}:v1`,
      exposure_id: ancien.id,
      sheet_id: "f1",
      revision: "r1",
    });
  });

  it("le même affichage réexposé ne repart pas", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    afficherLeR2(journey);

    expect(journey.exposeButtons(BOUTONS_DE_LA_FICHE).events).toEqual([]);
  });

  it("la fiche garde sa version tant que la révision tient, et passe à f2 avec la suivante", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    afficherLeR2(journey);
    const reaffichee = afficherLeR2(journey).events;
    modifierP2(journey);

    const suivante = afficherLeR2(journey).events;

    expect(reaffichee.map(({ sheet_id }) => sheet_id)).toEqual(["f1", "f1"]);
    expect(suivante).toEqual([
      expect.objectContaining({ sheet_id: "f2", revision: "r2" }),
      expect.objectContaining({ sheet_id: "f2", revision: "r2" }),
    ]);
  });

  it("sans révision courante, aucun bouton n'est exposé", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    afficherLeR2(journey);
    modifierP2(journey);
    journey.openAResultScreen("R2");

    expect(journey.exposeButtons(BOUTONS_DE_LA_FICHE)).toEqual({
      events: [],
      exposures: {},
    });
  });

  it("l'avis en R2 porte la révision, sans fiche ni document", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

    const [avis] = afficherLeR2(journey, ["feedback"]).events;

    expect(avis).toMatchObject({
      type: "feedback_exposed",
      exposure_id: `${journey.simulationId}:v1:feedback:r1`,
      revision: "r1",
    });
    expect(avis).not.toHaveProperty("sheet_id");
    expect(avis).not.toHaveProperty("document_id");
  });
});

describe("les boutons du document R3", () => {
  // Le R2, puis le R3 et son document prêt : ses boutons exposés.
  function afficherLeR3(journey: Journey, quantite = "2") {
    afficherLeR2(journey);
    journey.openAResultScreen("R3");
    journey.displayDocument(unDocument(quantite));
    return journey.exposeButtons(BOUTONS_DU_DOCUMENT);
  }

  it("le document prêt expose ses boutons et l'avis, avec sa version", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

    const { events } = afficherLeR3(journey);

    const vue = `${journey.simulationId}:v2`;
    expect(enBref(events)).toEqual([
      `action_exposed/print ${vue}:document_print:d1`,
      `action_exposed/download ${vue}:document_download:d1`,
      `feedback_exposed ${vue}:feedback:d1`,
    ]);
    expect(events).toEqual(
      events.map(() =>
        expect.objectContaining({
          screen: "R3",
          document_id: "d1",
          revision: "r1",
        }),
      ),
    );
  });

  it("une nouvelle version dans le même affichage expose à nouveau ses boutons", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    afficherLeR3(journey);

    journey.displayDocument(unDocument("3"));
    const { events } = journey.exposeButtons(BOUTONS_DU_DOCUMENT);

    expect(events.map(({ document_id }) => document_id)).toEqual([
      "d2",
      "d2",
      "d2",
    ]);
  });

  it("seul un téléchargement réussit : l'impression et l'avis n'ont que leur clic", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    const { exposures } = afficherLeR3(journey);
    const { document_print, document_download, feedback } = exposures;
    if (!document_print || !document_download || !feedback)
      throw new Error("Un bouton du document n'est pas exposé.");

    const gestes = [
      ...journey.press(document_print, "requested"),
      ...journey.press(document_print, "succeeded"),
      ...journey.press(document_download, "requested"),
      ...journey.press(document_download, "succeeded"),
      ...journey.press(feedback, "requested"),
      ...journey.press(feedback, "succeeded"),
    ];

    expect(gestes.map(({ type }) => type)).toEqual([
      "document_print_requested",
      "document_download_requested",
      "document_download_succeeded",
      "feedback_clicked",
    ]);
    expect(gestes.at(-1)).toMatchObject({ screen: "R3", document_id: "d1" });
  });
});
