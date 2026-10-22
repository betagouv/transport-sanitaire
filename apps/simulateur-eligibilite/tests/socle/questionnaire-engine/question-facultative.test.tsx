import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Page } from "../../../core/socle/questionnaire-engine/question";
import { afficher } from "./afficher";

// Une question peut rester sans réponse. Les pages sont écrites ici.

const ADRESSE: Page = {
  id: "adresse",
  questions: [
    { id: "voie", kind: "text", label: "Numéro et voie" },
    { id: "complement", kind: "text", label: "Complément", optional: true },
  ],
};

const AVIS: Page = {
  id: "avis",
  questions: [
    {
      id: "avis",
      kind: "single choice",
      label: "Un avis ?",
      optional: true,
      options: [
        { value: "bien", label: "Bien" },
        { value: "mal", label: "Mal" },
      ],
    },
  ],
};

const voie = () => screen.getByRole("textbox", { name: "Numéro et voie" });
const complement = () =>
  screen.getByRole("textbox", { name: "Complément (facultatif)" });
const valider = () =>
  screen.getByRole("button", { name: /^(Suivant|Terminer)$/ });

describe("question facultative", () => {
  it("le dit dans son libellé", () => {
    afficher([ADRESSE]);

    expect(complement()).toBeInTheDocument();
  });

  it("laisse valider la page sans réponse", async () => {
    const { user, reponses } = afficher([ADRESSE]);

    await user.type(voie(), "3 rue des Lilas");
    await user.click(valider());

    expect(reponses()).toEqual({ voie: "3 rue des Lilas" });
  });

  it("garde la réponse quand il y en a une", async () => {
    const { user, reponses } = afficher([ADRESSE]);

    await user.type(voie(), "3 rue des Lilas");
    await user.type(complement(), "Bâtiment B");
    await user.click(valider());

    expect(reponses()).toEqual({
      voie: "3 rue des Lilas",
      complement: "Bâtiment B",
    });
  });

  it("ne dispense pas des autres questions de la page", async () => {
    const { user } = afficher([ADRESSE]);

    await user.type(complement(), "Bâtiment B");

    expect(valider()).toBeDisabled();
  });

  it("garde son bouton, même en choix unique : la page n'avance pas seule", async () => {
    const { user, reponses } = afficher([AVIS]);

    expect(valider()).toBeEnabled();
    await user.click(valider());

    expect(reponses()).toEqual({});
  });
});
