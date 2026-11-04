import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { givenOf, page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// Une question peut rester sans réponse. Les pages sont écrites ici.

type Questions = {
  voie: string;
  complement: string;
  avis: "bien" | "mal";
  lieu: "domicile" | "foyer";
  nom: string;
};

const question = questionsOf<Questions>();
const given = givenOf<Questions>();

const ADRESSE = page(
  "adresse",
  question.text("voie", "Numéro et voie"),
  question.text("complement", "Complément").optional(),
);

const AVIS = page(
  "avis",
  question
    .singleChoice("avis", "Un avis ?")
    .options({ bien: "Bien", mal: "Mal" })
    .optional(),
);

// Le nom n'est demandé que pour un foyer.
const LIEU = page(
  "lieu",
  question
    .singleChoice("lieu", "Quel lieu ?")
    .options({ domicile: "Domicile", foyer: "Foyer" }),
  question
    .text("nom", "Nom")
    .requiredWhen(given.question("lieu").answer().is("foyer")),
);

const voie = () => screen.getByRole("textbox", { name: "Numéro et voie" });
const complement = () =>
  screen.getByRole("textbox", { name: "Complément (facultatif)" });
const valider = () =>
  screen.getByRole("button", { name: /^(Suivant|Terminer)$/ });

describe("question facultative", () => {
  it("le dit dans son libellé", () => {
    afficher([ADRESSE]);

    expect(complement()).toBeInTheDocument();
  });

  it("laisse valider la page sans réponse", async () => {
    const { user, reponses } = afficher([ADRESSE]);

    await user.type(voie(), "3 rue des Lilas");
    await user.click(valider());

    expect(reponses()).toEqual({ voie: "3 rue des Lilas" });
  });

  it("garde la réponse quand il y en a une", async () => {
    const { user, reponses } = afficher([ADRESSE]);

    await user.type(voie(), "3 rue des Lilas");
    await user.type(complement(), "Bâtiment B");
    await user.click(valider());

    expect(reponses()).toEqual({
      voie: "3 rue des Lilas",
      complement: "Bâtiment B",
    });
  });

  it("ne dispense pas des autres questions de la page", async () => {
    const { user } = afficher([ADRESSE]);

    await user.type(complement(), "Bâtiment B");

    expect(valider()).toBeDisabled();
  });

  it("garde son bouton, même en choix unique : la page n'avance pas seule", async () => {
    const { user, reponses } = afficher([AVIS]);

    expect(valider()).toBeEnabled();
    await user.click(valider());

    expect(reponses()).toEqual({});
  });
});

describe("question facultative sauf dans un cas (requiredWhen)", () => {
  it("reste facultative quand la condition ne tient pas", async () => {
    const { user, reponses } = afficher([LIEU]);

    await user.click(screen.getByRole("radio", { name: "Domicile" }));
    expect(
      screen.getByRole("textbox", { name: "Nom (facultatif)" }),
    ).toBeInTheDocument();
    await user.click(valider());

    expect(reponses()).toEqual({ lieu: "domicile" });
  });

  it("attend une réponse quand la condition tient", async () => {
    const { user, reponses } = afficher([LIEU]);

    await user.click(screen.getByRole("radio", { name: "Foyer" }));
    expect(valider()).toBeDisabled();
    await user.type(
      screen.getByRole("textbox", { name: "Nom" }),
      "Les Tilleuls",
    );
    await user.click(valider());

    expect(reponses()).toEqual({ lieu: "foyer", nom: "Les Tilleuls" });
  });
});
