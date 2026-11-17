// Les boutons du document R3, et leurs clics (ADR-0047, ANA22-02) : une
// exposition par version du document tant qu'il reste prêt, et chaque clic
// rattaché à l'exposition courante. L'impression et le téléchargement lancés
// portent le document, et ne comptent pas comme des clics.

import { describe, expect, it } from "vitest";
import {
  afficherLeR2,
  afficherLeR3,
  BOUTONS_DU_DOCUMENT,
  compter,
  enBref,
  unDocument,
  unParcours,
} from "./parcours-des-boutons";

describe("les boutons du document R3", () => {
  it("le document prêt expose ses boutons et l'avis, sur sa version", () => {
    const journey = unParcours();

    const exposes = afficherLeR3(journey);

    expect(enBref(exposes)).toEqual([
      "button_exposed document_print d1",
      "button_exposed document_download d1",
      "feedback_exposed - r1",
    ]);
    expect(exposes).toEqual(
      exposes.map(() =>
        expect.objectContaining({
          screen: "R3",
          revision: "r1",
          document_id: "d1",
        }),
      ),
    );
    // L'avis garde son contrat : il n'a pas de révision du document.
    expect(exposes.slice(0, 2)).toEqual([
      expect.objectContaining({ document_revision: "dr1" }),
      expect.objectContaining({ document_revision: "dr1" }),
    ]);
  });

  it("une nouvelle version dans le même affichage expose à nouveau ses boutons", () => {
    const journey = unParcours();
    const premiers = afficherLeR3(journey);

    journey.displayDocument(unDocument("3"));
    const suivants = journey.exposeButtons(BOUTONS_DU_DOCUMENT);

    expect(suivants.map(({ document_id }) => document_id)).toEqual([
      "d2",
      "d2",
      "d2",
    ]);
    expect(suivants[0]?.exposure_id).not.toBe(premiers[0]?.exposure_id);
  });

  it("un clic venu d'un ancien document ne part pas", () => {
    const journey = unParcours();
    afficherLeR3(journey);

    journey.displayDocument(unDocument("3"));

    expect(journey.click("document_print")).toEqual([]);
  });

  it("retirés puis réaffichés sur la même version, les boutons ont une nouvelle exposition", () => {
    const journey = unParcours();
    const avant = afficherLeR3(journey);

    journey.withdrawButtons("R3");
    const pendantLeRetrait = journey.click("document_print");
    const apres = journey.exposeButtons(BOUTONS_DU_DOCUMENT);

    expect(pendantLeRetrait).toEqual([]);
    expect(apres.map(({ document_id }) => document_id)).toEqual([
      "d1",
      "d1",
      "d1",
    ]);
    const ids = [...avant, ...apres].map(({ exposure_id }) => exposure_id);
    expect(new Set(ids).size).toBe(6);
  });

  it("le retrait du R3 laisse les boutons d'un autre écran", () => {
    const journey = unParcours();
    const [imprimer] = afficherLeR2(journey, ["patient_sheet_print"]);

    journey.withdrawButtons("R3");

    expect(journey.click("patient_sheet_print")).toEqual([
      expect.objectContaining({ exposure_id: imprimer?.exposure_id }),
    ]);
  });

  it("le clic est un `button_clicked` ; l'impression et le téléchargement lancés portent le document, sans exposition", () => {
    const journey = unParcours();
    const exposes = afficherLeR3(journey);

    const gestes = [
      ...journey.click("document_print"),
      ...journey.requestDocument("print"),
      ...journey.click("document_download"),
      ...journey.requestDocument("download"),
      ...journey.deliverDocument(),
    ];

    expect(enBref(gestes)).toEqual([
      "button_clicked document_print d1",
      "document_print_requested - r1",
      "button_clicked document_download d1",
      "document_download_requested - r1",
      "document_download_succeeded - r1",
    ]);
    expect(gestes).toEqual(
      gestes.map(() =>
        expect.objectContaining({
          screen: "R3",
          revision: "r1",
          document_revision: "dr1",
          document_id: "d1",
        }),
      ),
    );
    const lances = gestes.filter(({ type }) => type !== "button_clicked");
    for (const lance of lances) {
      expect(lance).not.toHaveProperty("exposure_id");
      expect(lance).not.toHaveProperty("button_id");
    }
    expect(compter([...exposes, ...gestes])).toMatchObject({
      expositions: 2,
      cliquees: 2,
      orphelins: 0,
    });
  });

  it("sans document affiché, rien n'est lancé", () => {
    const journey = unParcours();
    afficherLeR2(journey);
    journey.openAResultScreen("R3");

    expect([
      ...journey.requestDocument("print"),
      ...journey.deliverDocument(),
    ]).toEqual([]);
  });
});
