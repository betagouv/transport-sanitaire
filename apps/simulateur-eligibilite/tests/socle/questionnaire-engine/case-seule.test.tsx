import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { validatedQuestions } from "../../../core/socle/questionnaire-engine/asked-questions";
import type { Page } from "../../../core/socle/questionnaire-engine/question";
import { afficher } from "./afficher";

// Une case seule : décochée sur une page validée, elle répond « non ». Les
// pages sont écrites ici.

const TRAJET: Page = {
  id: "trajet",
  questions: [
    {
      id: "distance",
      kind: "single choice",
      label: "Quelle distance ?",
      options: [
        { value: "courte", label: "Courte" },
        { value: "longue", label: "Longue" },
      ],
    },
    {
      id: "avion",
      kind: "checkbox",
      label: "Une partie du trajet se fera en avion.",
      box: "Oui, une partie du trajet se fera en avion.",
    },
  ],
};

const caseAvion = () =>
  screen.getByRole("checkbox", {
    name: "Oui, une partie du trajet se fera en avion.",
  });
const valider = () => screen.getByRole("button", { name: "Terminer" });

describe("case seule", () => {
  it("s'affiche sous son libellé, sans se dire facultative", () => {
    afficher([TRAJET]);

    expect(
      screen.getByText("Une partie du trajet se fera en avion."),
    ).toBeInTheDocument();
    expect(caseAvion()).not.toBeChecked();
    expect(screen.queryByText(/facultatif/)).not.toBeInTheDocument();
  });

  it("décochée, laisse valider la page et répond « non »", async () => {
    const { user, reponses } = afficher([TRAJET]);

    await user.click(screen.getByLabelText("Longue"));
    await user.click(valider());

    expect(reponses()).toEqual({ distance: "longue", avion: false });
  });

  it("cochée, répond « oui »", async () => {
    const { user, reponses } = afficher([TRAJET]);

    await user.click(screen.getByLabelText("Longue"));
    await user.click(caseAvion());
    await user.click(valider());

    expect(reponses()).toEqual({ distance: "longue", avion: true });
  });

  it("décochée après coup, répond « non »", async () => {
    const { user, reponses } = afficher([TRAJET]);

    await user.click(screen.getByLabelText("Longue"));
    await user.click(caseAvion());
    await user.click(caseAvion());
    await user.click(valider());

    expect(reponses()).toEqual({ distance: "longue", avion: false });
  });

  it("n'est pas validée tant que sa page ne l'est pas", () => {
    expect(validatedQuestions([TRAJET], { distance: "longue" })).toEqual({
      distance: { offered: ["courte", "longue"], answer: "longue" },
    });
    expect(
      validatedQuestions([TRAJET], { distance: "longue", avion: false }),
    ).toEqual({
      distance: { offered: ["courte", "longue"], answer: "longue" },
      avion: { answer: false },
    });
  });

  it("non touchée, laisse se révéler les questions qui la suivent sur sa page", async () => {
    const { user } = afficher([
      {
        id: "trajet",
        questions: [
          TRAJET.questions[1] as Page["questions"][number],
          TRAJET.questions[0] as Page["questions"][number],
          {
            id: "escale",
            kind: "text",
            label: "Où se fait l'escale ?",
            askedIf: ({ validated }) =>
              validated.question("distance").is("longue"),
          },
        ],
      },
    ]);

    await user.click(screen.getByLabelText("Longue"));

    expect(
      screen.getByRole("textbox", { name: "Où se fait l'escale ?" }),
    ).toBeInTheDocument();
  });
});
