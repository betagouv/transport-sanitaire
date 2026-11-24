import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TextEdits } from "../../../core/socle/simulation";
import { CerfaDocument } from "../../../front/socle/cerfa/CerfaDocument";
import { type Cerfa, strictText } from "../../../front/socle/cerfa/cerfa";
import { PREVIEW_MARK } from "../../../front/socle/cerfa/generate-the-cerfa/generate-the-cerfa";
import { ecouterLesTelechargements } from "../simulateur/telechargements";
import { drawnOn } from "./pdf-aplati";
import { testForm } from "./test-form";

// Un texte strict qui ne tient pas sur le cerfa se réécrit au-dessus de son
// aperçu : le compteur, le message, « Valider » qui attend un texte qui tient,
// et les exports suspendus jusqu'au document régénéré. L'écran garde les textes
// comme la simulation (`TextEdits`).

type Fiche = {
  fields: { motif?: string };
  drawings: Record<never, never>;
};

const FICHE: Cerfa<Fiche> = {
  template: testForm,
  fileName: "fiche",
  fields: { motif: strictText("motif", "Motif du transport") },
  drawings: {},
};

const TELECHARGER = { name: "Télécharger la fiche" };
const CHAMP = { name: "Motif du transport" };
const VALIDER = { name: "Valider" };
const MESSAGE =
  "Raccourcissez le texte présent dans 'Motif du transport' pour pouvoir imprimer ou télécharger le document.";
const LONG = "Un motif médical beaucoup trop long pour ce cadre. ".repeat(4);

let ecoute: ReturnType<typeof ecouterLesTelechargements>;
beforeEach(() => {
  ecoute = ecouterLesTelechargements();
});
afterEach(() => ecoute.arreter());

describe("un texte strict qui tient", () => {
  it("n'ouvre aucun éditeur, et le document se télécharge", async () => {
    afficher({ motif: "Dialyse." });

    await genere();

    expect(screen.queryByRole("textbox", CHAMP)).toBeNull();
  });
});

describe("un texte strict qui déborde", () => {
  it("ouvre son éditeur, avec le message, et suspend les exports", async () => {
    afficher({ motif: LONG });

    const champ = await screen.findByRole("textbox", CHAMP);

    expect(champ).toHaveValue(LONG);
    expect(champ).toHaveAccessibleDescription(expect.stringContaining(MESSAGE));
    expect(screen.getByRole("button", VALIDER)).toBeDisabled();
    expect(screen.getByRole("button", TELECHARGER)).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Imprimer la fiche" }),
    ).toBeDisabled();
  });

  it("compte les caractères saisis contre le maximum, sans rien tronquer", async () => {
    afficher({ motif: LONG });

    const champ = await screen.findByRole("textbox", CHAMP);

    const [saisis, maximum] = compteur();
    expect(saisis).toBe(Array.from(LONG).length);
    expect(maximum).toBeGreaterThan(0);
    expect(maximum).toBeLessThan(saisis);
    expect(champ).not.toHaveAttribute("maxlength");
  });

  it("raccourci, se valide, puis le document régénéré se télécharge sans marque", async () => {
    const user = userEvent.setup();
    afficher({ motif: LONG });
    const champ = await screen.findByRole("textbox", CHAMP);

    await user.clear(champ);
    await user.type(champ, "Dialyse.");
    await waitFor(() =>
      expect(screen.getByRole("button", VALIDER)).toBeEnabled(),
    );
    expect(champ).not.toHaveAccessibleDescription(
      expect.stringContaining(MESSAGE),
    );
    expect(screen.queryByText(MESSAGE)).toBeNull();
    expect(screen.getByRole("button", TELECHARGER)).toBeDisabled();
    await user.click(screen.getByRole("button", VALIDER));
    await user.click(await genere());

    expect(screen.queryByRole("textbox", CHAMP)).toBeNull();
    const { texts } = await drawnOn(await pdfDe(ecoute.telechargements[0]));
    expect(texts).toContain("Dialyse.");
    expect(texts).not.toContain(PREVIEW_MARK);
  });

  it("vidé, se valide, et le document n'a plus de texte", async () => {
    const user = userEvent.setup();
    afficher({ motif: LONG });
    const champ = await screen.findByRole("textbox", CHAMP);

    await user.clear(champ);
    await waitFor(() =>
      expect(screen.getByRole("button", VALIDER)).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", VALIDER));
    await user.click(await genere());

    const { texts } = await drawnOn(await pdfDe(ecoute.telechargements[0]));
    expect(texts).toEqual([]);
  });
});

// ---- implémentation ----

// Le bouton « Télécharger », actif une fois le PDF généré.
async function genere() {
  const bouton = await screen.findByRole("button", TELECHARGER);
  await waitFor(() => expect(bouton).toBeEnabled());
  return bouton;
}

// « saisis / maximum », sous le champ.
function compteur(): [number, number] {
  const texte = screen.getByText(/^\d+ \/ \d+ caractères$/).textContent ?? "";
  const [saisis, maximum] = texte.match(/\d+/g) ?? [];
  return [Number(saisis), Number(maximum)];
}

function afficher(fields: Fiche["fields"]) {
  render(<Ecran fields={fields} />);
}

// L'écran, qui garde les textes réécrits comme la simulation, et remonte le
// document à chaque texte validé.
function Ecran({ fields }: { fields: Fiche["fields"] }) {
  const [edits, setEdits] = useState(TextEdits.none());
  return (
    <CerfaDocument
      key={JSON.stringify(edits.accepted)}
      cerfa={FICHE}
      dto={{ fields: { ...fields, ...edits.accepted }, drawings: {} }}
      date={new Date("2026-10-14T10:00:00Z")}
      printLabel="Imprimer la fiche"
      downloadLabel="Télécharger la fiche"
      edits={{
        drafts: edits.drafts,
        onEdit: (entry, text) => setEdits((now) => now.draft(entry, text)),
        onValidate: (entry) => setEdits((now) => now.accept(entry)),
      }}
    />
  );
}

async function pdfDe(
  telechargement: (typeof ecoute.telechargements)[number] | undefined,
) {
  if (!telechargement) throw new Error("Aucun téléchargement.");
  return telechargement.contenu();
}
