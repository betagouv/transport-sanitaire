// La feuille à remettre se télécharge en PDF, sans la boîte d'impression du
// navigateur. Le PDF se prépare au clic, sur la feuille affichée : pendant ce
// temps, « Télécharger » attend et dit « Préparation du PDF ». Un échec se
// signale sans retirer la feuille. Le navigateur de test ne met pas en page :
// la feuille y mesure zéro, et son PDF y échoue toujours.

import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  bouton,
  ouvrirLeSimulateur,
  qui,
  repondreJusquAuResultat,
} from "./questionnaire";

describe("le téléchargement de la feuille", () => {
  it("suit « Imprimer », hors de ce qui s'imprime", async () => {
    await avecUneFeuille();

    const telecharger = bouton("Télécharger");
    expect(avant(bouton("Imprimer"), telecharger)).toBe(true);
    expect(telecharger.closest(".fr-no-print")).not.toBeNull();
  });

  it("attend et dit « Préparation du PDF » pendant que le PDF se prépare", async () => {
    await avecUneFeuille();

    fireEvent.click(bouton("Télécharger"));

    expect(bouton("Préparation du PDF")).toBeDisabled();
  });

  it("qui échoue le dit, garde la feuille affichée et permet de réessayer", async () => {
    await avecUneFeuille();

    fireEvent.click(bouton("Télécharger"));

    expect(
      await within(laVisionneuse()).findByText(
        "Le téléchargement a échoué. Réessayez ou utilisez « Imprimer ».",
      ),
    ).toHaveAttribute("role", "status");
    expect(within(laFeuille()).getByText("Un contenu")).toBeVisible();
    expect(bouton("Télécharger")).toBeEnabled();
  });
});

// ---- implémentation ----

// Le premier résultat, avec une feuille.
async function avecUneFeuille() {
  const user = await ouvrirLeSimulateur({
    modele: qui(async () => ({
      title: "Le résultat",
      sheet: { title: "Votre commande", body: "Un contenu" },
    })),
  });
  await repondreJusquAuResultat(user);
  await screen.findByRole("heading", { level: 1, name: "Le résultat" });
  return user;
}

function laVisionneuse() {
  return screen.getByRole("region", { name: "Aperçu de la fiche patient" });
}

function laFeuille() {
  return screen.getByRole("article", { name: "Fiche explicative patient" });
}

function avant(premier: HTMLElement, second: HTMLElement) {
  return (
    (premier.compareDocumentPosition(second) &
      Node.DOCUMENT_POSITION_FOLLOWING) !==
    0
  );
}
