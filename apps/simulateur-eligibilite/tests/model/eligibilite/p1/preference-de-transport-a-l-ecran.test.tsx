// Les sous-titres des choix de Q1.4 (module 02, « Sous-titres des choix de
// transport », TS1018-10) : sous chaque titre, gris comme en P0, une phrase
// par ligne, rattachés au choix pour les lecteurs d'écran.

import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { afficherLaPage, page } from "../formulaire-du-modele";

const Q14 = /^Le patient pouvant réaliser le trajet/;

describe("les choix de transport de Q1.4", () => {
  it.each([
    [
      "Véhicule personnel.",
      [
        "Véhicule du patient ou celui d’un proche.",
        "Prise en charge sur la base de 0,30 €/km, plus les frais de parking et de péage sur justificatifs.",
        REMBOURSEMENT,
      ],
    ],
    [
      "Transports en commun terrestres.",
      [
        "Prise en charge sur la base du prix du ticket de transport en commun ou du billet de train en 2e classe.",
        REMBOURSEMENT,
      ],
    ],
  ])("%s : son sous-titre, une phrase par ligne", async (titre, phrases) => {
    afficherLaPage("P1/4", {
      "Q0.1": "1_VERIFIER",
      "Q1.1": "1_SEUL",
      "Q1.3": ["7_AUCUNE"],
    });
    await page(Q14);

    const sousTitre = sousTitreDe(titre);
    expect(sousTitre).toHaveClass("fr-hint-text");
    expect(lignesDe(sousTitre)).toEqual(phrases);
    expect(
      screen.getByRole("radio", { name: new RegExp(`^${titre}`) }),
    ).toBeInTheDocument();
  });
});

// ---- implémentation ----

const REMBOURSEMENT =
  "Remboursement en moins d’une semaine via le compte ameli, si le service est disponible.";

const sousTitreDe = (titre: string) => {
  const label = screen.getByText(titre, { exact: false, selector: "label" });
  const sousTitre = label.querySelector(".fr-hint-text");
  if (!(sousTitre instanceof HTMLElement))
    throw new Error(`${titre} : pas de sous-titre`);
  return sousTitre;
};

const lignesDe = (element: HTMLElement) => element.innerHTML.split("<br>");
