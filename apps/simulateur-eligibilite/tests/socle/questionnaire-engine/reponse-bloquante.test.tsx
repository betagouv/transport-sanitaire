import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Page } from "../../../front/socle/questionnaire-engine/question";
import { afficher } from "./afficher";

// Une option peut arrêter le questionnaire : son message s'affiche, et on
// n'avance plus. Les pages sont écrites ici.

const MESSAGE =
  "Un retour différent demande une autre simulation, pour l'autre sens.";

const ORGANISATION = {
  id: "organisation",
  kind: "single choice",
  label: "Comment le trajet est-il organisé ?",
  options: [
    { value: "aller", label: "Aller simple" },
    { value: "different", label: "Aller-retour différent", blocks: MESSAGE },
  ],
} as const;

const TRAJET: Page = {
  id: "trajet",
  questions: [
    { id: "nombre", kind: "number", label: "Combien de transports ?" },
    ORGANISATION,
  ],
};

const SEULE: Page = { id: "organisation", questions: [ORGANISATION] };

const SUITE: Page = {
  id: "depart",
  questions: [{ id: "depart", kind: "text", label: "Lieu de départ" }],
};

const EQUIPEMENTS: Page = {
  id: "equipements",
  questions: [
    {
      id: "equipements",
      kind: "multiple choice",
      label: "Quels équipements ?",
      options: [
        { value: "fauteuil", label: "Un fauteuil" },
        {
          value: "autre",
          label: "Un autre",
          blocks: "Précisez avec la caisse.",
        },
      ],
    },
  ],
};

const radio = (name: string) => screen.getByRole("radio", { name });
const valider = () =>
  screen.getByRole("button", { name: /^(Suivant|Terminer)$/ });
const unInstant = () => new Promise((fini) => setTimeout(fini, 300));

describe("réponse qui bloque", () => {
  it("affiche son message et bloque le bouton", async () => {
    const { user } = afficher([TRAJET]);
    await user.type(screen.getByRole("spinbutton"), "2");

    await user.click(radio("Aller-retour différent"));

    expect(screen.getByText(MESSAGE)).toBeInTheDocument();
    expect(valider()).toBeDisabled();
  });

  it("libère le bouton dès qu'une autre réponse est choisie", async () => {
    const { user, reponses } = afficher([TRAJET]);
    await user.type(screen.getByRole("spinbutton"), "2");
    await user.click(radio("Aller-retour différent"));

    await user.click(radio("Aller simple"));

    expect(screen.queryByText(MESSAGE)).toBeNull();
    await user.click(valider());
    expect(reponses()).toEqual({ nombre: 2, organisation: "aller" });
  });

  it("retient une page qui avancerait seule", async () => {
    const { user } = afficher([SEULE, SUITE]);

    await user.click(radio("Aller-retour différent"));
    await unInstant();

    expect(screen.getByText(MESSAGE)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("vaut aussi pour une case cochée", async () => {
    const { user } = afficher([EQUIPEMENTS]);

    await user.click(screen.getByRole("checkbox", { name: "Un fauteuil" }));
    await user.click(screen.getByRole("checkbox", { name: "Un autre" }));

    expect(screen.getByText("Précisez avec la caisse.")).toBeInTheDocument();
    expect(valider()).toBeDisabled();
  });
});
