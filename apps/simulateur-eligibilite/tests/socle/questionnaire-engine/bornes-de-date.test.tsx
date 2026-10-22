import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// Une date, avec ou sans heure, peut avoir des bornes. Elles sont fixes, ou
// calculées d'après les réponses. Les pages sont écrites ici.

type Questions = { accident: string; debut: string; fin: string };

const question = questionsOf<Questions>({ options: {} });

const ACCIDENT = page(
  "accident",
  question
    .date("accident", "Date de l'accident")
    .min("2026-01-01")
    .max("2026-10-12"),
);

const PERMISSION = page(
  "permission",
  question.datetime("debut", "Début de la permission"),
  question
    .datetime("fin", "Fin de la permission")
    .boundsFrom(({ answers }) => ({ min: answers.question("debut").value })),
);

const champ = (name: string) => screen.getByLabelText(name);
const valider = () =>
  screen.getByRole("button", { name: /^(Suivant|Terminer)$/ });

describe("bornes d'une date", () => {
  it("les donne au champ, pour que le calendrier grise ce qui en sort", () => {
    afficher([ACCIDENT]);

    expect(champ("Date de l'accident")).toHaveAttribute("min", "2026-01-01");
    expect(champ("Date de l'accident")).toHaveAttribute("max", "2026-10-12");
  });

  it("refuse une date avant la borne basse, et dit laquelle", async () => {
    const { user } = afficher([ACCIDENT]);

    await user.type(champ("Date de l'accident"), "2025-12-31");

    expect(
      screen.getByText("Indiquez une date à partir du 01/01/2026."),
    ).toBeInTheDocument();
    expect(valider()).toBeDisabled();
  });

  it("refuse une date après la borne haute, et dit laquelle", async () => {
    const { user } = afficher([ACCIDENT]);

    await user.type(champ("Date de l'accident"), "2026-10-13");

    expect(
      screen.getByText("Indiquez une date au plus tard le 12/10/2026."),
    ).toBeInTheDocument();
  });

  it("accepte une date sur la borne", async () => {
    const { user, reponses } = afficher([ACCIDENT]);

    await user.type(champ("Date de l'accident"), "2026-10-12");
    await user.click(valider());

    expect(reponses()).toEqual({ accident: "2026-10-12" });
  });

  it("calcule une borne d'après une réponse de la page", async () => {
    const { user } = afficher([PERMISSION]);

    await user.type(champ("Début de la permission"), "2026-10-12T08:30");
    await user.type(champ("Fin de la permission"), "2026-10-11T18:00");

    expect(
      screen.getByText("Indiquez une date à partir du 12/10/2026 à 08:30."),
    ).toBeInTheDocument();
    expect(valider()).toBeDisabled();
  });
});
