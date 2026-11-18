// L'urgence, Q2.3.4, sur la page du trajet : elle s'affiche dans le panneau du
// premier de ses déclencheurs devenu effectif, la tranche de distance ou la
// case de la ligne régulière, et y reste quand l'autre le devient. Retiré, il
// la laisse passer sous l'autre, sa réponse gardée (NAV-PANNEAUX-20261116,
// D-307).

import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Answers } from "../../../../core/socle/questionnaire-engine";
import { declencheurDe } from "../../../socle/questionnaire/panneaux";
import {
  afficherLaPage,
  choisir,
  choisirDans,
  page,
} from "../formulaire-du-modele";
import { SANS_SITUATION } from "./reponses-de-la-permission";

const DISTANCE = /^Quelle distance sépare/;
const URGENCE = /^Attestez-vous que ce transport est urgent/;

// Une consultation : au-delà de 150 km, la longue distance ouvre l'accord
// préalable ; en avion ou en bateau de ligne, la ligne l'ouvre.
const { "Q2.3.1": _, "Q2.3.2": __, ...AVANT_LE_TRAJET } = SANS_SITUATION;
const CONSULTATION: Answers = { ...AVANT_LE_TRAJET, "Q2.1": "1_CONSULTATION" };

const plusDe150 = () => screen.getByRole("radio", { name: "Plus de 150 km." });
const ligne = () => screen.getByRole("checkbox", { name: /^Une partie/ });
const urgences = () => screen.queryAllByRole("group", { name: URGENCE });
const declencheurDeLUrgence = () =>
  declencheurDe(screen.getByRole("group", { name: URGENCE }));

describe("l'urgence sous ses déclencheurs, sur la page du trajet", () => {
  it("va sous la distance choisie la première, une seule fois", async () => {
    const user = afficherLaPage("P2/trajet", CONSULTATION);
    await page(DISTANCE);

    await user.click(plusDe150());
    await user.click(ligne());

    expect(urgences()).toHaveLength(1);
    expect(declencheurDeLUrgence()).toBe(plusDe150());
  });

  // À 50 km ou moins, seule la ligne l'ouvre ; la distance allongée ensuite
  // ne la déplace pas.
  it("va sous la ligne qui l'a ouverte la première", async () => {
    const user = afficherLaPage("P2/trajet", CONSULTATION);
    await page(DISTANCE);

    await choisir(user, /^50 km ou moins/);
    await user.click(ligne());
    await user.click(plusDe150());

    expect(urgences()).toHaveLength(1);
    expect(declencheurDeLUrgence()).toBe(ligne());
  });

  it("passe sous la ligne, répondue, quand la distance ne l'ouvre plus", async () => {
    const user = afficherLaPage("P2/trajet", CONSULTATION);
    await page(DISTANCE);
    await user.click(plusDe150());
    await user.click(ligne());

    await choisirDans(user, URGENCE, /^Oui\.$/);
    await choisir(user, /^50 km ou moins/);

    expect(declencheurDeLUrgence()).toBe(ligne());
    expect(
      within(screen.getByRole("group", { name: URGENCE })).getByRole("radio", {
        name: /^Oui\.$/,
      }),
    ).toBeChecked();
  });
});
