import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TextEdits } from "../../../core/socle/simulation";
import { CerfaUseCasesProvider } from "../../../front/socle/cerfa";
import { CerfaDocument } from "../../../front/socle/cerfa/CerfaDocument";
import { CerfaFactory } from "../../../front/socle/cerfa/cerfa.factory";
import type { Cerfa } from "../../../front/socle/cerfa/cerfa.types";
import { ecouterLesTelechargements } from "../simulateur/telechargements";
import { casDUsageDuCerfa } from "./generer-le-cerfa";
import { drawnOn } from "./pdf-aplati";
import { testForm } from "./test-form";

const { at, strictDrawing } = CerfaFactory;

// Un texte strict dessiné tient sur une ligne de sa place (T06, R04) : un
// retour à la ligne, ou un texte trop large, ne tient pas. Il se réécrit comme
// un texte de champ, avec les mots de sa règle, et un texte requis ne se valide
// pas vide.

type Fiche = {
  fields: Record<never, never>;
  drawings: { note?: string };
};

const DEBORDE = "Raccourcissez la note pour imprimer.";
const REQUISE = "Précisez la note.";

const FICHE: Cerfa<Fiche> = {
  template: testForm,
  fileName: "fiche",
  fields: {},
  drawings: {
    note: strictDrawing(at({ page: 1, x: 20, y: 100, width: 120 }), "Note", {
      size: 8,
      overflowMessage: DEBORDE,
      requiredMessage: REQUISE,
    }),
  },
};

const TELECHARGER = { name: "Télécharger la fiche" };
const CHAMP = { name: "Note" };
const VALIDER = { name: "Valider" };

let ecoute: ReturnType<typeof ecouterLesTelechargements>;
beforeEach(() => {
  ecoute = ecouterLesTelechargements();
});
afterEach(() => ecoute.arreter());

describe("un texte strict dessiné", () => {
  it("court, se dessine sans éditeur", async () => {
    render(<Ecran note="Dialyse" />);

    await genere();

    expect(screen.queryByRole("textbox", CHAMP)).toBeNull();
  });

  it("coupé d'un retour à la ligne, s'ouvre tel quel avec son message", async () => {
    render(<Ecran note={"Dialyse\nen centre"} />);

    const champ = await screen.findByRole("textbox", CHAMP);

    expect(champ).toHaveValue("Dialyse\nen centre");
    expect(champ).toHaveAccessibleDescription(expect.stringContaining(DEBORDE));
    expect(screen.getByText("17 / 7 caractères")).toBeInTheDocument();
    expect(screen.getByRole("button", VALIDER)).toBeDisabled();
  });

  it("requis, ne se valide pas vide", async () => {
    const user = userEvent.setup();
    render(<Ecran note={"Dialyse\nen centre"} />);
    const champ = await screen.findByRole("textbox", CHAMP);

    await user.clear(champ);

    expect(champ).toHaveAccessibleDescription(expect.stringContaining(REQUISE));
    expect(screen.getByRole("button", VALIDER)).toBeDisabled();
  });

  it("remis sur une ligne, se valide et se dessine", async () => {
    const user = userEvent.setup();
    render(<Ecran note={"Dialyse\nen centre"} />);
    const champ = await screen.findByRole("textbox", CHAMP);

    await user.clear(champ);
    await user.type(champ, "Dialyse en centre");
    await waitFor(() =>
      expect(screen.getByRole("button", VALIDER)).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", VALIDER));
    await user.click(await genere());

    const telechargement = ecoute.telechargements[0];
    if (!telechargement) throw new Error("Aucun téléchargement.");
    const { texts } = await drawnOn(await telechargement.contenu());
    expect(texts).toContain("Dialyse en centre");
  });
});

// ---- implémentation ----

async function genere() {
  const bouton = await screen.findByRole("button", TELECHARGER);
  await waitFor(() => expect(bouton).toBeEnabled());
  return bouton;
}

// L'écran, qui remet chaque texte validé à sa place dessinée.
function Ecran({ note }: { note: string }) {
  const [edits, setEdits] = useState(TextEdits.none());
  const [cas] = useState(casDUsageDuCerfa);
  return (
    <CerfaUseCasesProvider value={cas}>
      <CerfaDocument
        key={JSON.stringify(edits.accepted)}
        cerfa={FICHE}
        dto={{ fields: {}, drawings: { note, ...edits.accepted } }}
        date={new Date("2026-10-14T10:00:00Z")}
        printLabel="Imprimer la fiche"
        downloadLabel="Télécharger la fiche"
        edits={{
          drafts: edits.drafts,
          onEdit: (entry, text) => setEdits((now) => now.draft(entry, text)),
          onValidate: (entry) => setEdits((now) => now.accept(entry)),
        }}
      />
    </CerfaUseCasesProvider>
  );
}
