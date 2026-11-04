import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// À chaque nouvelle page, en avant comme en arrière, le titre de sa première
// question prend le focus, hors de l'ordre de tabulation
// (NAV-Q221-PROGRESSIF-001). Le retour en haut de l'écran ne se voit pas ici.
// Les pages sont écrites ici.

type Questions = { voie: string; lieu: "domicile" | "foyer" };

const question = questionsOf<Questions>();

const PAGES = [
  page("adresse", question.text("voie", "Numéro et voie")),
  page(
    "lieu",
    question
      .singleChoice("lieu", "Quel lieu ?")
      .options({ domicile: "Domicile", foyer: "Foyer" }),
  ),
];

describe("le focus à l'entrée d'une page", () => {
  it("va au titre de la première question, dès la première page", () => {
    afficher(PAGES);

    expect(titre("Numéro et voie")).toHaveFocus();
    expect(titre("Numéro et voie")).toHaveAttribute("tabindex", "-1");
  });

  it("va au titre de la page suivante", async () => {
    const { user } = afficher(PAGES);

    await allerALieu(user);

    expect(titre("Quel lieu ?")).toHaveFocus();
  });

  it("revient au titre de la page précédente", async () => {
    const { user } = afficher(PAGES);
    await allerALieu(user);

    await user.click(screen.getByRole("button", { name: "Précédent" }));

    expect(titre("Numéro et voie")).toHaveFocus();
  });
});

// ---- implémentation ----

function titre(texte: string): HTMLElement {
  return screen.getByText(texte, { selector: "legend, label" });
}

async function allerALieu(user: ReturnType<typeof afficher>["user"]) {
  await user.type(
    screen.getByRole("textbox", { name: "Numéro et voie" }),
    "3 rue des Lilas",
  );
  await user.click(screen.getByRole("button", { name: "Suivant" }));
  await screen.findByText("Quel lieu ?", { selector: "legend" });
}
