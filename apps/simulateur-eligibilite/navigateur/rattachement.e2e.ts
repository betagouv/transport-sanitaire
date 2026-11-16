// L'écran de rattachement, dans l'iframe : le référentiel arrive par l'API du
// simulateur, et le questionnaire s'ouvre dès le service choisi.

import { expect } from "@playwright/test";
import { defautsGraves, seRattacher, test } from "./simulateur-embarque.ts";

test("le questionnaire s'ouvre dès le service choisi", async ({
  page,
  simulateur,
}) => {
  await expect(
    simulateur.getByRole("combobox", { name: /Établissement/ }),
  ).toBeVisible();
  expect(await defautsGraves(page)).toEqual([]);

  await seRattacher(simulateur);

  await expect(
    simulateur.getByRole("group", { name: "Quel est votre besoin ?" }),
  ).toBeVisible();
});
