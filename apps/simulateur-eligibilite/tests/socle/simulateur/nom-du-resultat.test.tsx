// Un résultat peut nommer sa page : le socle range sous ce nom tout ce qu'il
// compose, du stepper aux boutons, même quand le résultat n'a pas de corps. Le
// lecteur d'écran l'annonce alors comme une zone.

import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ouvrirLeSimulateur,
  qui,
  repondreJusquAuResultat,
} from "./questionnaire";

describe("un résultat qui nomme sa page", () => {
  it("range sous ce nom le stepper, le titre et les boutons", async () => {
    const user = await ouvrirLeSimulateur({
      modele: qui(async () => ({ title: "Sans corps", label: "La zone" })),
    });
    await repondreJusquAuResultat(user);

    const zone = await screen.findByRole("region", { name: "La zone" });
    expect(
      within(zone).getByRole("heading", { name: /Étape 1 sur/ }),
    ).toBeInTheDocument();
    expect(
      within(zone).getByRole("heading", { level: 1, name: "Sans corps" }),
    ).toBeInTheDocument();
    expect(
      within(zone).getByRole("button", { name: "Précédent" }),
    ).toBeInTheDocument();
  });
});
