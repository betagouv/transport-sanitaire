// Les boutons de la fiche patient et l'avis, et leurs clics (ANA22-02) : une
// exposition tant que le bouton reste affiché sur le même objet, et chaque clic
// rattaché à l'exposition courante de son bouton.

import { describe, expect, it } from "vitest";
import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event.types";
import {
  afficherLeR2,
  BOUTONS_DE_LA_FICHE,
  compter,
  modifierP2,
  unParcours,
} from "./parcours-des-boutons";

describe("les boutons de la fiche patient", () => {
  it("le R2 expose « Imprimer » et « Télécharger » sur la version f1 de sa fiche", () => {
    const journey = unParcours();

    const exposes = afficherLeR2(journey);

    expect(exposes).toEqual([
      expect.objectContaining({
        type: "button_exposed",
        button_id: "patient_sheet_print",
        screen: "R2",
        revision: "r1",
        artifact_id: "f1",
      }),
      expect.objectContaining({
        type: "button_exposed",
        button_id: "patient_sheet_download",
        screen: "R2",
        revision: "r1",
        artifact_id: "f1",
      }),
    ]);
    expect(exposes[0]?.exposure_id).not.toBe(exposes[1]?.exposure_id);
    expect(exposes[0]).not.toHaveProperty("document_id");
    // Une exposition est passive : seul le clic vient du prescripteur.
    expect(exposes[0]?.activity_origin).toBe("background");
  });

  it("deux clics sur une exposition : deux clics, une exposition cliquée", () => {
    const journey = unParcours();
    const exposes = afficherLeR2(journey, ["patient_sheet_print"]);

    const clics = [
      ...journey.click("patient_sheet_print"),
      ...journey.click("patient_sheet_print"),
    ];

    expect(clics).toEqual([
      expect.objectContaining({
        type: "button_clicked",
        button_id: "patient_sheet_print",
        activity_origin: "user",
        exposure_id: exposes[0]?.exposure_id,
        screen: "R2",
        revision: "r1",
        artifact_id: "f1",
      }),
      expect.objectContaining({ exposure_id: exposes[0]?.exposure_id }),
    ]);
    expect(compter([...exposes, ...clics])).toEqual({
      expositions: 1,
      cliquees: 1,
      simulationsExposees: 1,
      simulationsCliquees: 1,
      orphelins: 0,
    });
  });

  it("deux affichages : deux expositions, une simulation, et le clic va à la courante", () => {
    const journey = unParcours();
    const premier = afficherLeR2(journey, ["patient_sheet_print"]);
    const second = afficherLeR2(journey, ["patient_sheet_print"]);

    const [clic] = journey.click("patient_sheet_print");

    expect(clic?.exposure_id).toBe(second[0]?.exposure_id);
    expect(premier[0]?.exposure_id).not.toBe(second[0]?.exposure_id);
    expect(compter([...premier, ...second, clic as AnalyticsEvent])).toEqual({
      expositions: 2,
      cliquees: 1,
      simulationsExposees: 1,
      simulationsCliquees: 1,
      orphelins: 0,
    });
  });

  it("le même affichage réexposé, comme un montage technique, ne repart pas", () => {
    const journey = unParcours();
    afficherLeR2(journey);

    expect(journey.exposeButtons(BOUTONS_DE_LA_FICHE)).toEqual([]);
  });

  it("la fiche garde sa version tant que la révision tient, et passe à f2 avec la suivante", () => {
    const journey = unParcours();
    afficherLeR2(journey);
    const reaffichee = afficherLeR2(journey);
    modifierP2(journey);

    const suivante = afficherLeR2(journey);

    expect(reaffichee.map(({ artifact_id }) => artifact_id)).toEqual([
      "f1",
      "f1",
    ]);
    expect(suivante).toEqual([
      expect.objectContaining({ artifact_id: "f2", revision: "r2" }),
      expect.objectContaining({ artifact_id: "f2", revision: "r2" }),
    ]);
  });

  it("sans révision courante, aucun bouton n'est exposé, et aucun clic ne part", () => {
    const journey = unParcours();
    afficherLeR2(journey);
    modifierP2(journey);
    journey.openAResultScreen("R2");

    expect(journey.exposeButtons(BOUTONS_DE_LA_FICHE)).toEqual([]);
    expect(journey.click("patient_sheet_print")).toEqual([]);
  });

  it("un clic sans exposition courante ne part pas : bouton jamais exposé, ou écran quitté", () => {
    const journey = unParcours();
    afficherLeR2(journey, ["patient_sheet_print"]);

    const jamaisExpose = journey.click("patient_sheet_download");
    journey.openAResultScreen("R3");
    const ecranQuitte = journey.click("patient_sheet_print");

    expect([...jamaisExpose, ...ecranQuitte]).toEqual([]);
  });
});

describe("l'avis", () => {
  it("en R2, il porte la révision, sans bouton ni objet, et son clic garde l'exposition", () => {
    const journey = unParcours();

    const [avis] = afficherLeR2(journey, ["feedback"]);
    const [clic] = journey.click("feedback");

    expect(avis).toMatchObject({
      type: "feedback_exposed",
      screen: "R2",
      revision: "r1",
    });
    expect(avis).not.toHaveProperty("button_id");
    expect(avis).not.toHaveProperty("artifact_id");
    expect(clic).toMatchObject({
      type: "feedback_clicked",
      exposure_id: avis?.exposure_id,
      activity_origin: "user",
    });
    expect(avis?.activity_origin).toBe("background");
  });
});
