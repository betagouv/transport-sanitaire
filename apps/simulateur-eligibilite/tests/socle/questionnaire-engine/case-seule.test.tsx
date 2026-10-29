import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { givenOf, page, questionsOf } from "../../../core/socle";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";
import { afficher } from "./afficher";

// Une case seule : décochée sur une page validée, elle répond « non ». Les
// pages sont écrites ici.

type Questions = {
  distance: "courte" | "longue";
  avion: boolean;
  bateau: boolean;
  escale: string;
};

const OPTIONS = {
  distance: { courte: "Courte", longue: "Longue" },
} as const;

const question = questionsOf<Questions>({ options: OPTIONS });
const given = givenOf<Questions>();

const DISTANCE = question.singleChoice("distance", "Quelle distance ?");

const AVION = question.checkbox(
  "avion",
  "Une partie du trajet se fera en avion.",
  "Oui, une partie du trajet se fera en avion.",
);

const TRAJET = page("trajet", DISTANCE, AVION);

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
    expect(
      new Questionnaire([TRAJET])
        .readWith({ distance: "longue" })
        .validated.toJSON(),
    ).toEqual({
      distance: { offered: ["courte", "longue"], answer: "longue" },
    });
    expect(
      new Questionnaire([TRAJET])
        .readWith({ distance: "longue", avion: false })
        .validated.toJSON(),
    ).toEqual({
      distance: { offered: ["courte", "longue"], answer: "longue" },
      avion: { answer: false },
    });
  });

  it("non touchée, laisse se révéler les questions qui la suivent sur sa page", async () => {
    const { user } = afficher([
      page(
        "trajet",
        AVION,
        DISTANCE,
        question
          .text("escale", "Où se fait l'escale ?")
          .appliesWhen(given.question("distance").answer().is("longue")),
      ),
    ]);

    await user.click(screen.getByLabelText("Longue"));

    expect(
      screen.getByRole("textbox", { name: "Où se fait l'escale ?" }),
    ).toBeInTheDocument();
  });
});

describe("case seule sans titre", () => {
  const BATEAU = question.checkbox(
    "bateau",
    "Une partie du trajet se fera en bateau.",
  );
  const caseBateau = () =>
    screen.getByRole("checkbox", {
      name: "Une partie du trajet se fera en bateau.",
    });

  it("porte son libellé, sans titre ni groupe au-dessus", () => {
    afficher([page("trajet", DISTANCE, BATEAU)]);

    expect(caseBateau()).not.toBeChecked();
    expect(screen.getAllByRole("group")).toHaveLength(1);
    expect(
      screen.getAllByText("Une partie du trajet se fera en bateau."),
    ).toHaveLength(1);
  });

  it("décochée, répond « non »", async () => {
    const { user, reponses } = afficher([page("trajet", DISTANCE, BATEAU)]);

    await user.click(screen.getByLabelText("Longue"));
    await user.click(valider());

    expect(reponses()).toEqual({ distance: "longue", bateau: false });
  });

  it("cochée, répond « oui »", async () => {
    const { user, reponses } = afficher([page("trajet", DISTANCE, BATEAU)]);

    await user.click(screen.getByLabelText("Longue"));
    await user.click(caseBateau());
    await user.click(valider());

    expect(reponses()).toEqual({ distance: "longue", bateau: true });
  });
});
