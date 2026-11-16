// Ce que le simulateur échange avec la page qui l'embarque, par le script du
// CMS : le thème de la page, et le refus de la mesure d'audience.

import { expect } from "@playwright/test";
import { seRattacher, test } from "./simulateur-embarque.ts";

const REFUSER = "Désactiver la mesure d'audience du simulateur";

test("l'iframe suit le thème de la page", async ({ page, simulateur }) => {
  await expect(simulateur.locator("html")).toHaveAttribute(
    "data-fr-theme",
    "light",
  );

  await page
    .locator("html")
    .evaluate((html) => html.setAttribute("data-fr-theme", "dark"));

  await expect(simulateur.locator("html")).toHaveAttribute(
    "data-fr-theme",
    "dark",
  );
});

test("plus rien ne part vers la mesure d'audience après un refus, même après rechargement", async ({
  page,
  simulateur,
  mesures,
}) => {
  await expect(simulateur.getByRole("combobox").first()).toBeVisible();
  await expect.poll(() => mesures.length).toBeGreaterThan(0);

  await page.getByRole("button", { name: REFUSER }).click();
  mesures.length = 0;
  await page.reload();

  // Jusqu'au questionnaire : un parcours ouvert se mesure, quand il est suivi.
  await seRattacher(simulateur);
  await expect(
    simulateur.getByRole("group", { name: "Quel est votre besoin ?" }),
  ).toBeVisible();
  expect(mesures).toEqual([]);
});
