import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// Une option peut porter une explication, affichée sous son libellé : ce sont
// les cartes radio du DSFR. Le questionnaire factice n'en a pas, la page est
// donc écrite ici.

type Questions = { duree: "peu" | "beaucoup" };

const OPTIONS = { duree: { peu: "Peu", beaucoup: "Beaucoup" } } as const;

const question = questionsOf<Questions>({ options: OPTIONS });

const DUREE = page(
  "duree",
  question
    .singleChoice("duree", "Combien de temps avez-vous ?")
    .option("peu", (option) => option.description("Environ 2 minutes.")),
);

describe("explication d'une option", () => {
  it("se lit avec le libellé de l'option qui la porte", () => {
    afficher([DUREE]);

    expect(
      screen.getByRole("radio", { name: "Peu Environ 2 minutes." }),
    ).toBeInTheDocument();
  });

  it("ne change rien à une option qui n'en a pas", () => {
    afficher([DUREE]);

    expect(screen.getByRole("radio", { name: "Beaucoup" })).toBeInTheDocument();
  });
});
