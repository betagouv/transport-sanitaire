import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CerfaDocument } from "../../../front/socle/cerfa/CerfaDocument";
import { type Cerfa, commentOn, text } from "../../../front/socle/cerfa/cerfa";
import { ecouterLesTelechargements } from "../simulateur/telechargements";
import { drawnOn, testForm } from "./test-form";

// Un commentaire facultatif qui ne tient pas sur le cerfa en est retiré. Le
// bouton le dit dès qu'il s'affiche, avant tout téléchargement (D-85).

type Fiche = {
  fields: { motif?: string; precisions?: string };
  drawings: Record<never, never>;
};

const FICHE: Cerfa<Fiche> = {
  template: testForm,
  fileName: "fiche",
  fields: { motif: text("motif"), precisions: commentOn("motif") },
  drawings: {},
};

const TELECHARGER = { name: "Télécharger la fiche" };
const RETIRE = /le commentaire facultatif ne tient pas sur le document/i;
const LONG = "Un commentaire beaucoup trop long pour ce cadre. ".repeat(4);

let ecoute: ReturnType<typeof ecouterLesTelechargements>;
beforeEach(() => {
  ecoute = ecouterLesTelechargements();
});
afterEach(() => ecoute.arreter());

describe("le commentaire facultatif", () => {
  it("retiré faute de place, s'annonce avant le téléchargement", async () => {
    afficher({ motif: "Dialyse.", precisions: LONG });

    await genere();

    expect(screen.getByText(RETIRE)).toBeVisible();
    expect(ecoute.telechargements).toEqual([]);
  });

  it("retiré, manque au cerfa téléchargé", async () => {
    const user = userEvent.setup();
    afficher({ motif: "Dialyse.", precisions: LONG });

    await user.click(await genere());

    const [pdf] = ecoute.telechargements;
    expect((await drawnOn(await pdfDe(pdf))).texts).toEqual(["Dialyse."]);
  });

  it("qui tient ne s'annonce pas", async () => {
    afficher({ motif: "Dialyse.", precisions: "Fauteuil." });

    await genere();

    expect(screen.queryByText(RETIRE)).toBeNull();
  });
});

// ---- implémentation ----

// Le bouton « Télécharger », actif une fois le PDF généré : il dit
// « Préparation du PDF… » d'ici là.
async function genere() {
  const bouton = await screen.findByRole("button", TELECHARGER);
  await waitFor(() => expect(bouton).toBeEnabled());
  return bouton;
}

function afficher(fields: Fiche["fields"]) {
  render(
    <CerfaDocument
      cerfa={FICHE}
      dto={{ fields, drawings: {} }}
      date={new Date("2026-10-14T10:00:00Z")}
      printLabel="Imprimer la fiche"
      downloadLabel="Télécharger la fiche"
    />,
  );
}

async function pdfDe(
  telechargement: (typeof ecoute.telechargements)[number] | undefined,
) {
  if (!telechargement) throw new Error("Aucun téléchargement.");
  return telechargement.contenu();
}
