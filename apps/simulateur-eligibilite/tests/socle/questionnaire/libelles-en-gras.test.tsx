import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// Un choix unique peut mettre le libellé de ses réponses possibles en gras,
// leur description restant grise dessous. Les pages sont écrites ici.

type Questions = { besoin: "verifier" | "prescrire" };

const question = questionsOf<Questions>();

const besoin = () =>
  question
    .singleChoice("besoin", "Quel est votre besoin ?")
    .possibleAnswers({ verifier: "Vérifier", prescrire: "Prescrire" })
    .possibleAnswer("verifier", (possibleAnswer) =>
      possibleAnswer.description("Environ 3 minutes"),
    );

describe("libellés de réponses possibles en gras", () => {
  it("met le libellé de chaque réponse possible en gras, et sa description en gris dessous", () => {
    afficher([page("besoin", besoin().boldLabels())]);

    expect(enGras("Vérifier")).toBe(true);
    expect(enGras("Prescrire")).toBe(true);
    const description = screen.getByText("Environ 3 minutes");
    expect(description).toHaveClass("fr-hint-text");
    expect(description.closest(".fr-text--bold")).toBeNull();
  });

  it("laisse les libellés en graisse normale sans ce réglage", () => {
    afficher([page("besoin", besoin())]);

    expect(enGras("Vérifier")).toBe(false);
  });
});

// ---- implémentation ----

function enGras(libelle: string) {
  return screen.getByText(libelle).closest(".fr-text--bold") !== null;
}
