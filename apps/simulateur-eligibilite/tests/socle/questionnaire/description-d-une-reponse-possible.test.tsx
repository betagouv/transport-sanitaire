import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// Une réponse possible peut porter une explication, affichée sous son libellé :
// ce sont les cartes radio du DSFR. Le questionnaire factice n'en a pas, la
// page est donc écrite ici.

type Questions = { duree: "peu" | "beaucoup" };

const question = questionsOf<Questions>();

const DUREE = page(
  "duree",
  question
    .singleChoice("duree", "Combien de temps avez-vous ?")
    .possibleAnswers({ peu: "Peu", beaucoup: "Beaucoup" })
    .possibleAnswer("peu", (possibleAnswer) =>
      possibleAnswer.description("Environ 2 minutes."),
    ),
);

describe("explication d'une réponse possible", () => {
  it("se lit avec le libellé de la réponse possible qui la porte", () => {
    afficher([DUREE]);

    expect(
      screen.getByRole("radio", { name: "Peu Environ 2 minutes." }),
    ).toBeInTheDocument();
  });

  it("ne change rien à une réponse possible qui n'en a pas", () => {
    afficher([DUREE]);

    expect(screen.getByRole("radio", { name: "Beaucoup" })).toBeInTheDocument();
  });
});
