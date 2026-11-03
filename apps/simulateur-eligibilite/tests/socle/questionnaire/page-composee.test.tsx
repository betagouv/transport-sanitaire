import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { givenOf, page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// Une page composée attend « Suivant », même complète : seule une page faite
// d'un choix unique affiché seul avance d'elle-même (D-240). Les pages sont
// écrites ici.

type Questions = {
  boisson: "cafe" | "the";
  taille: "petite" | "grande";
  sucre: boolean;
  suite: "oui" | "non";
};

const OPTIONS = {
  boisson: { cafe: "Café", the: "Thé" },
  taille: { petite: "Petite", grande: "Grande" },
  suite: { oui: "Oui", non: "Non" },
} as const;

const question = questionsOf<Questions>({ options: OPTIONS });
const given = givenOf<Questions>();

const BOISSON = question.singleChoice("boisson", "Quelle boisson ?");
const TAILLE = question.singleChoice("taille", "Quelle taille ?");
const SUITE = page("suite", question.singleChoice("suite", "Une suite ?"));

const suivant = () => screen.getByRole("button", { name: "Suivant" });
const laSuite = () => screen.findByRole("group", { name: "Une suite ?" });
const resteSurLaPage = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(screen.queryByRole("group", { name: "Une suite ?" })).toBeNull();
};

describe("page composée", () => {
  it("un choix unique seul avance de lui-même", async () => {
    const { user } = afficher([page("boisson", BOISSON), SUITE]);

    await user.click(screen.getByLabelText("Café"));

    expect(await laSuite()).toBeInTheDocument();
  });

  it("deux choix uniques attendent « Suivant », même remplis", async () => {
    const { user } = afficher([page("boisson", BOISSON, TAILLE), SUITE]);

    await user.click(screen.getByLabelText("Café"));
    await user.click(screen.getByLabelText("Grande"));
    await resteSurLaPage();

    await user.click(suivant());
    expect(await laSuite()).toBeInTheDocument();
  });

  it("un sous-champ révélé fait attendre « Suivant »", async () => {
    const SOUS_CHAMP = TAILLE.appliesWhen(
      given.question("boisson").answer().is("cafe"),
    );
    const { user } = afficher([page("boisson", BOISSON, SOUS_CHAMP), SUITE]);

    await user.click(screen.getByLabelText("Café"));
    await user.click(screen.getByLabelText("Grande"));
    await resteSurLaPage();
  });

  it("sans sous-champ révélé, la même page avance d'elle-même", async () => {
    const SOUS_CHAMP = TAILLE.appliesWhen(
      given.question("boisson").answer().is("cafe"),
    );
    const { user } = afficher([page("boisson", BOISSON, SOUS_CHAMP), SUITE]);

    await user.click(screen.getByLabelText("Thé"));

    expect(await laSuite()).toBeInTheDocument();
  });

  it("une case à côté du choix fait attendre « Suivant »", async () => {
    const SUCRE = question.checkbox("sucre", "Avec du sucre.");
    const { user } = afficher([page("boisson", BOISSON, SUCRE), SUITE]);

    await user.click(screen.getByLabelText("Café"));
    await resteSurLaPage();
  });
});
