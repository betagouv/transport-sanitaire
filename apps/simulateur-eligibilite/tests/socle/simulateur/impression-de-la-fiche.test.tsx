import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ACCOMPAGNEMENTS,
  allerAuResultat,
  bouton,
  caseACocher,
  ouvrirLeSimulateur,
  question,
} from "./questionnaire";

// La fiche du premier résultat s'imprime depuis le navigateur. Imprimer ne
// verrouille rien, et seule la fiche part à l'impression.

let impressions: number;

// happy-dom n'a pas de `window.print` : on le fournit, et on compte les appels.
beforeEach(() => {
  impressions = 0;
  window.print = () => {
    impressions += 1;
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, "print");
});

describe("la fiche du premier résultat", () => {
  it("s'imprime sans rien verrouiller", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);

    await user.click(bouton("Imprimer la commande"));
    await user.click(bouton("Précédent"));

    expect(impressions).toBe(1);
    await question(ACCOMPAGNEMENTS);
    expect(caseACocher("Du lait")).toBeChecked();
  });

  it("n'imprime que la fiche, sans les boutons ni le stepper", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);

    const pasImprime = (element: HTMLElement) =>
      element.closest(".fr-no-print") !== null;
    expect(pasImprime(screen.getByText("Commande : thé, lait"))).toBe(false);
    expect(pasImprime(bouton("Imprimer la commande"))).toBe(true);
    expect(pasImprime(bouton("Compléter la commande"))).toBe(true);
    expect(
      pasImprime(screen.getByRole("heading", { name: "Étape 1 sur 2" })),
    ).toBe(true);
  });
});
