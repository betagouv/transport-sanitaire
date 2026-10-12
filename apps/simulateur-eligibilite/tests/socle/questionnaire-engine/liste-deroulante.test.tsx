import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Page } from "../../../front/socle/questionnaire-engine/question";
import { afficher } from "./afficher";

// Un choix unique peut se rendre en liste déroulante. Les pages sont écrites
// ici.

const LIEU: Page = {
  id: "lieu",
  questions: [
    {
      id: "lieu",
      kind: "single choice",
      dropdown: true,
      label: "Quel est le lieu de départ ?",
      hint: "Le lieu où le patient est pris en charge.",
      options: [
        { value: "domicile", label: "Domicile" },
        { value: "etablissement", label: "Établissement de soins" },
      ],
    },
  ],
};

const liste = () =>
  screen.getByRole("combobox", { name: /^quel est le lieu de départ/i });
const valider = () =>
  screen.getByRole("button", { name: /^(Suivant|Terminer)$/ });

describe("liste déroulante", () => {
  it("propose les options dans une liste, sans bouton radio", () => {
    afficher([LIEU]);

    const options = within(liste()).getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      "Domicile",
      "Établissement de soins",
    ]);
    expect(screen.queryByRole("radio")).toBeNull();
  });

  it("montre l'indication de la question", () => {
    afficher([LIEU]);

    expect(
      screen.getByText("Le lieu où le patient est pris en charge."),
    ).toBeInTheDocument();
  });

  it("attend un choix pour valider", () => {
    afficher([LIEU]);

    expect(valider()).toBeDisabled();
  });

  it("n'avance pas seule : un choix attend le bouton", async () => {
    const { user, reponses } = afficher([LIEU]);

    await user.selectOptions(liste(), "Établissement de soins");

    expect(reponses()).toBeUndefined();
    await user.click(valider());
    expect(reponses()).toEqual({ lieu: "etablissement" });
  });
});
