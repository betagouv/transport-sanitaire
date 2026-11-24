// @vitest-environment node
//
// La collecte des boutons exposés et de leurs clics (ANA22-02), sur le vrai
// serveur Express et le journal en mémoire : quatre boutons fermés, chacun sur
// son écran, l'objet qu'il montre, et un clic qui vient du prescripteur.

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

// « Imprimer » exposé sur la fiche f1 du R2.
const surLaFiche = {
  ...simulationStarted,
  event_id: "s-1:5",
  sequence: 5,
  type: "button_exposed",
  button_id: "patient_sheet_print",
  exposure_id: "s-1:x1",
  screen: "R2",
  revision: "r1",
  artifact_id: "f1",
};

// « Télécharger » cliqué sur le document d1 du R3.
const surLeDocument = {
  ...simulationStarted,
  event_id: "s-1:9",
  sequence: 9,
  type: "button_clicked",
  button_id: "document_download",
  activity_origin: "user",
  exposure_id: "s-1:x3",
  screen: "R3",
  revision: "r1",
  document_revision: "d1",
  document_id: "d1",
  artifact_id: "d1",
};

// Le téléchargement lancé du document d1.
const lance = {
  ...simulationStarted,
  event_id: "s-1:10",
  sequence: 10,
  type: "document_download_requested",
  screen: "R3",
  revision: "r1",
  document_revision: "d1",
  document_id: "d1",
};

const sans = (evenement: object, champ: string) =>
  Object.fromEntries(Object.entries(evenement).filter(([k]) => k !== champ));

describe("collecte des boutons", () => {
  it.each([
    ["un bouton de la fiche exposé", surLaFiche],
    ["un bouton du document cliqué", surLeDocument],
    ["un téléchargement lancé", lance],
  ])("garde %s", async (_cas, evenement) => {
    const journal = await collecteSur();

    const { status } = await collecter(evenement);

    expect(status).toBe(204);
    expect((await journal.find(evenement.event_id))?.event).toEqual(evenement);
  });

  it.each([
    ["un bouton hors de la liste", { ...surLaFiche, button_id: "feedback" }],
    ["un bouton de la fiche sur le R3", { ...surLaFiche, screen: "R3" }],
    ["un bouton du document sur le R2", { ...surLeDocument, screen: "R2" }],
    ["un bouton sans son objet", sans(surLaFiche, "artifact_id")],
    ["un bouton sans exposition", sans(surLaFiche, "exposure_id")],
    ["un bouton sans révision", sans(surLaFiche, "revision")],
    ["un bouton sans bouton", sans(surLaFiche, "button_id")],
    [
      "un bouton du document sans sa révision",
      sans(surLeDocument, "document_revision"),
    ],
    ["un bouton du document sans document", sans(surLeDocument, "document_id")],
    [
      "un bouton du document sur un autre objet",
      { ...surLeDocument, artifact_id: "d2" },
    ],
    [
      "un clic d'une autre origine",
      { ...surLeDocument, activity_origin: "replay" },
    ],
    ["un clic sans origine", sans(surLeDocument, "activity_origin")],
    ["une origine inconnue", { ...surLaFiche, activity_origin: "robot" }],
    [
      "un lancement sans révision du document",
      sans(lance, "document_revision"),
    ],
    ["un lancement sans document", sans(lance, "document_id")],
    [
      "une demande de la fiche, retirée du contrat",
      { ...lance, type: "sheet_print_requested" },
    ],
  ])("refuse %s, sans rien écrire", async (_cas, evenement) => {
    const journal = await collecteSur();

    const { status } = await collecter(evenement);

    expect(status).toBe(400);
    expect(await journal.find(String(evenement.event_id))).toBeUndefined();
  });
});
