import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Page } from "../../../core/socle/questionnaire-engine/question";
import { afficher } from "./afficher";

// Un texte peut se saisir sur plusieurs lignes. Les pages sont écrites ici.

const PRECISIONS: Page = {
  id: "precisions",
  questions: [
    {
      id: "precisions",
      kind: "long text",
      label: "Quelles précisions sur le soin ?",
    },
  ],
};

const zone = () =>
  screen.getByRole("textbox", { name: /^quelles précisions sur le soin/i });
const valider = () =>
  screen.getByRole("button", { name: /^(Suivant|Terminer)$/ });

describe("texte long", () => {
  it("se saisit dans une zone de texte", () => {
    afficher([PRECISIONS]);

    expect(zone().tagName).toBe("TEXTAREA");
  });

  it("va à la ligne sur « Entrée », sans valider la page", async () => {
    const { user, reponses } = afficher([PRECISIONS]);

    await user.type(zone(), "Séance de dialyse{Enter}Trois fois par semaine");

    expect(reponses()).toBeUndefined();
    await user.click(valider());
    expect(reponses()).toEqual({
      precisions: "Séance de dialyse\nTrois fois par semaine",
    });
  });

  it("attend une saisie pour valider", () => {
    afficher([PRECISIONS]);

    expect(valider()).toBeDisabled();
  });
});
