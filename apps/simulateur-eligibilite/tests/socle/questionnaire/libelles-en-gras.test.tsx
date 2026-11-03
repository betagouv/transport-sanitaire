import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// Un choix unique peut mettre le libellé de ses options en gras, leur
// description restant grise dessous. Les pages sont écrites ici.

type Questions = { besoin: "verifier" | "prescrire" };

const OPTIONS = {
  besoin: { verifier: "Vérifier", prescrire: "Prescrire" },
} as const;

const question = questionsOf<Questions>({ options: OPTIONS });

const besoin = () =>
  question
    .singleChoice("besoin", "Quel est votre besoin ?")
    .option("verifier", (option) => option.description("Environ 3 minutes"));

describe("libellés d'options en gras", () => {
  it("met le libellé de chaque option en gras, et sa description en gris dessous", () => {
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
