import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// Une réponse qui dépend d'une autre sur la même page (`dependsOn`) se vide à
// l'écran quand celle-ci change. Les pages sont écrites ici.

type Questions = {
  sens: "aller" | "retour";
  nombre: number;
  accompagne: boolean;
  note: string;
};

const OPTIONS = { sens: { aller: "Aller", retour: "Retour" } } as const;

const question = questionsOf<Questions>({ options: OPTIONS });

const TRAJET = page(
  "trajet",
  question.singleChoice("sens", "Quel sens ?"),
  question.number("nombre", "Combien ?").dependsOn("sens"),
  question
    .checkbox("accompagne", "Accompagné.", "Oui, accompagné.")
    .dependsOn("sens"),
  question.text("note", "Une note ?"),
);

const nombre = () => screen.getByRole("spinbutton");
const accompagne = () =>
  screen.getByRole("checkbox", { name: "Oui, accompagné." });
const terminer = () =>
  screen.getByRole("button", { name: /^(Suivant|Terminer)$/ });

async function remplirEnAller() {
  const ecran = afficher([TRAJET]);
  await ecran.user.click(screen.getByLabelText("Aller"));
  await ecran.user.type(nombre(), "3");
  await ecran.user.click(accompagne());
  await ecran.user.type(screen.getByLabelText("Une note ?"), "à l'heure");
  return ecran;
}

describe("réponse dépendante sur la même page", () => {
  it("se vide quand la réponse dont elle dépend change, et la page attend", async () => {
    const { user } = await remplirEnAller();

    await user.click(screen.getByLabelText("Retour"));

    expect(nombre()).toHaveValue(null);
    expect(accompagne()).not.toBeChecked();
    expect(screen.getByLabelText("Une note ?")).toHaveValue("à l'heure");
    expect(terminer()).toBeDisabled();
  });

  it("se valide une fois ressaisie", async () => {
    const { user, reponses } = await remplirEnAller();

    await user.click(screen.getByLabelText("Retour"));
    await user.type(nombre(), "2");
    await user.click(terminer());

    expect(reponses()).toEqual({
      sens: "retour",
      nombre: 2,
      accompagne: false,
      note: "à l'heure",
    });
  });

  it("reste quand la même réponse est redonnée", async () => {
    const { user } = await remplirEnAller();

    await user.click(screen.getByLabelText("Aller"));

    expect(nombre()).toHaveValue(3);
    expect(accompagne()).toBeChecked();
  });
});
