// Le questionnaire déroulé dans l'iframe jusqu'au premier résultat, puis ce
// qu'un prescripteur en fait : télécharger la fiche du patient, compléter la
// prescription.

import { readFile } from "node:fs/promises";
import { expect } from "@playwright/test";
import {
  defautsGraves,
  jusquAuResultat,
  seRattacher,
  test,
} from "./simulateur-embarque.ts";

const ELIGIBLE =
  "Votre patient est éligible à une prise en charge de son transport";

test.beforeEach(async ({ simulateur }) => {
  await seRattacher(simulateur);
  await jusquAuResultat(simulateur);
  await expect(
    simulateur.getByRole("heading", { name: ELIGIBLE }),
  ).toBeVisible();
});

test("le résultat s'affiche avec la fiche du patient, sans défaut grave d'accessibilité", async ({
  page,
  simulateur,
}) => {
  await expect(
    simulateur.getByRole("article", { name: "Fiche explicative patient" }),
  ).toBeVisible();
  expect(await defautsGraves(page)).toEqual([]);
});

test("la fiche du patient se télécharge en PDF", async ({
  page,
  simulateur,
}) => {
  const telechargement = page.waitForEvent("download");
  await simulateur.getByRole("button", { name: "Télécharger" }).click();
  const fichier = await telechargement;

  expect(fichier.suggestedFilename()).toMatch(/^fiche-patient-.*\.pdf$/);
  const contenu = await readFile(await fichier.path());
  expect(contenu.subarray(0, 5).toString()).toBe("%PDF-");
});

test("« Compléter la prescription » ouvre la dernière étape", async ({
  simulateur,
}) => {
  await simulateur
    .getByRole("button", { name: "Compléter la prescription" })
    .click();

  await expect(
    simulateur.getByRole("group", {
      name: "Quel trajet cette prescription doit-elle couvrir ?",
    }),
  ).toBeVisible();
});
