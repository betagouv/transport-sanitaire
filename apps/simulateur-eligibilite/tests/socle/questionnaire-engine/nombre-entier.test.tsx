import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// Un nombre peut n'accepter qu'un entier. Les pages sont écrites ici.

type Questions = { transports: number; poids: number };

const question = questionsOf<Questions>({ options: {} });

const TRANSPORTS = page(
  "transports",
  question.number("transports", "Combien de transports ?").min(1).integer(),
);

const POIDS = page("poids", question.number("poids", "Quel poids ?"));

const champ = () => screen.getByRole("spinbutton");
// Le bouton de la dernière page s'appelle « Suivant » tant qu'elle n'est pas
// valide.
const terminer = () =>
  screen.getByRole("button", { name: /^(Suivant|Terminer)$/ });

describe("nombre entier", () => {
  it("refuse une décimale, et dit pourquoi", async () => {
    const { user } = afficher([TRANSPORTS]);

    await user.type(champ(), "2.5");

    expect(
      screen.getByText("Indiquez un nombre entier, sans décimale."),
    ).toBeInTheDocument();
    expect(terminer()).toBeDisabled();
  });

  it("accepte un entier", async () => {
    const { user, reponses } = afficher([TRANSPORTS]);

    await user.type(champ(), "4");
    await user.click(terminer());

    expect(reponses()).toEqual({ transports: 4 });
  });

  it("garde ses bornes", async () => {
    const { user } = afficher([TRANSPORTS]);

    await user.type(champ(), "0");

    expect(
      screen.getByText("Indiquez un nombre d’au moins 1."),
    ).toBeInTheDocument();
  });

  it("laisse passer une décimale quand rien ne l'interdit", async () => {
    const { user, reponses } = afficher([POIDS]);

    await user.type(champ(), "72.5");
    await user.click(terminer());

    expect(reponses()).toEqual({ poids: 72.5 });
  });
});
