import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// Un choix unique peut s'afficher en liste déroulante. Les pages sont écrites
// ici.

type Questions = { lieu: "domicile" | "etablissement" };

const OPTIONS = {
  lieu: { domicile: "Domicile", etablissement: "Établissement de soins" },
} as const;

const question = questionsOf<Questions>({ options: OPTIONS });

const LIEU = page(
  "lieu",
  question
    .singleChoice("lieu", "Quel est le lieu de départ ?")
    .dropdown()
    .hint("Le lieu où le patient est pris en charge."),
);

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
