// Ce que partagent les parcours en navigateur : le simulateur ouvert dans
// l'iframe de la page hôte, les gestes d'un prescripteur jusqu'au premier
// résultat, et le relevé des défauts d'accessibilité graves.

import AxeBuilder from "@axe-core/playwright";
import {
  test as base,
  type FrameLocator,
  type Locator,
  type Page,
} from "@playwright/test";
import { TITRE_DE_L_IFRAME } from "./page-hote.ts";

type Embarque = {
  /** Les appels partis vers la mesure d'audience, dans l'ordre. */
  mesures: string[];
  /** Le simulateur, dans l'iframe de la page hôte déjà ouverte. */
  simulateur: FrameLocator;
};

export const test = base.extend<Embarque>({
  // Le build de production active la mesure d'audience : rien ne doit partir
  // vers la vraie instance. Chaque appel est noté, puis reçoit une réponse vide.
  mesures: async ({ page }, use) => {
    const appels: string[] = [];
    await page.route(MESURE_D_AUDIENCE, (route) => {
      appels.push(route.request().url());
      return route.fulfill({ status: 204, body: "" });
    });
    await use(appels);
  },
  simulateur: async ({ page, mesures: _mesures }, use) => {
    await page.goto("/");
    await use(page.frameLocator(`iframe[title="${TITRE_DE_L_IFRAME}"]`));
  },
});

/** Franchit l'écran de rattachement : le questionnaire s'ouvre sur Q0.1. */
export async function seRattacher(simulateur: FrameLocator) {
  const liste = (nom: RegExp) =>
    simulateur.getByRole("combobox", { name: nom });
  await liste(/Établissement/).selectOption("CHU Grenoble Alpes");
  await liste(/Nom du service/).selectOption("Cardiologie");
}

/**
 * Répond jusqu'au premier résultat : un patient autonome, en véhicule
 * personnel, qui entre à l'hôpital depuis son domicile, à moins de 50 km.
 */
export async function jusquAuResultat(simulateur: FrameLocator) {
  const radio = (nom: RegExp) => simulateur.getByRole("radio", { name: nom });
  const case_ = (nom: RegExp) =>
    simulateur.getByRole("checkbox", { name: nom });
  await choisir(radio(/^Vérifier une éligibilité/));
  await choisir(radio(/^Peut se déplacer seul/));
  await choisir(case_(/^Aucune de ces situations/));
  await suivant(simulateur);
  await choisir(radio(/^Véhicule personnel/));
  await choisir(radio(/^Entrée ou sortie d’hospitalisation/));
  await choisir(radio(/^Une entrée dans un établissement de santé/));
  await suivant(simulateur);
  await choisir(case_(/^Non, aucune de ces situations/));
  await suivant(simulateur);
  await choisir(case_(/^Non, aucun\./));
  await suivant(simulateur);
  await choisir(radio(/^50 km ou moins/));
  await suivant(simulateur);
  await choisir(radio(/^Son domicile/));
}

/**
 * Les défauts d'accessibilité graves ou critiques de la page, iframe comprise,
 * d'après axe. Les défauts modérés ne sont pas relevés ici.
 */
export async function defautsGraves(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations
    .filter(({ impact }) => impact === "serious" || impact === "critical")
    .map(({ id, nodes }) => `${id} : ${nodes[0]?.target.join(" ")}`);
}

// ---- implémentation ----

const MESURE_D_AUDIENCE = /stats\.beta\.gouv\.fr/;

// Le DSFR dessine sa case par-dessus l'`input` : le clic est forcé, il tombe
// sur le libellé comme celui d'un prescripteur.
function choisir(reponse: Locator) {
  return reponse.check({ force: true });
}

function suivant(simulateur: FrameLocator) {
  return simulateur.getByRole("button", { name: "Suivant" }).click();
}
