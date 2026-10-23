import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";
import { afficher } from "./afficher";

// Le questionnaire relève ce qui est validé : chaque question qui a eu sa
// réponse, ce qui s'y proposait, et ce qui y a été répondu. Une case non cochée
// ne se lit pas de la même façon selon qu'elle a été proposée ou non : le
// modèle en a besoin pour dire « non » plutôt que « on ne sait pas ».

type Questions = {
  regime: "tout" | "vegetarien";
  allergies: readonly ("gluten" | "arachide")[];
  proteines: string;
  plats: readonly ("salade" | "steak" | "rien")[];
  dessert: string;
};

const OPTIONS = {
  regime: { tout: "Je mange de tout", vegetarien: "Végétarien" },
  allergies: { gluten: "Au gluten", arachide: "À l'arachide" },
  plats: { salade: "Une salade", steak: "Un steak", rien: "Rien" },
} as const;

const question = questionsOf<Questions>({ options: OPTIONS });

const REGIME = page(
  "regime",
  question.singleChoice("regime", "Quel est votre régime ?"),
  question.multipleChoice("allergies", "Des allergies ?").optional(),
  question
    .text("proteines", "Quelles protéines ?")
    // Sur la même page : la question lit celle qui la précède.
    .askedIf(({ validated }) => validated.question("regime").is("vegetarien")),
);

const PLATS = page(
  "plats",
  question
    .multipleChoice("plats", "Quels plats ?")
    .option("steak", (option) =>
      option.offeredIf(({ answers }) => answers.question("regime").is("tout")),
    )
    .exclusive("rien"),
);

const DESSERT = page(
  "dessert",
  question
    .text("dessert", "Quel dessert ?")
    .askedIf(({ validated }) => validated.question("plats").hasAnswer()),
);

const PAGES = [REGIME, PLATS, DESSERT];
const QUESTIONNAIRE = new Questionnaire(PAGES);

describe("les questions validées", () => {
  it("sont vides tant que rien n'a de réponse", () => {
    expect(QUESTIONNAIRE.readWith({}).validated.toJSON()).toEqual({});
  });

  it("portent ce qui se proposait et ce qui a été répondu", () => {
    const { regime } = QUESTIONNAIRE.readWith({
      regime: "tout",
    }).validated.toJSON();
    expect(regime).toEqual({ offered: ["tout", "vegetarien"], answer: "tout" });
  });

  it("gardent une question facultative restée sans réponse", () => {
    const { allergies } = QUESTIONNAIRE.readWith({
      regime: "tout",
    }).validated.toJSON();
    expect(allergies).toEqual({ offered: ["gluten", "arachide"] });
  });

  it("ne retiennent que les options qui se proposaient", () => {
    const answers = {
      regime: "vegetarien",
      proteines: "Tofu",
      plats: ["rien"],
    };
    expect(QUESTIONNAIRE.readWith(answers).validated.toJSON().plats).toEqual({
      offered: ["salade", "rien"],
      answer: ["rien"],
    });
  });

  it("ne donnent pas d'options à une saisie libre", () => {
    const answers = { regime: "tout", plats: ["steak"], dessert: "Une tarte" };
    expect(QUESTIONNAIRE.readWith(answers).validated.toJSON().dessert).toEqual({
      answer: "Une tarte",
    });
  });

  it("ignorent une question qui ne se pose pas", () => {
    const validated = QUESTIONNAIRE.readWith({
      regime: "tout",
    }).validated.toJSON();
    expect(validated).not.toHaveProperty("proteines");
  });

  it("s'arrêtent à la première question qui attend sa réponse", () => {
    const sansRegime = { plats: ["salade"], dessert: "Une tarte" };
    expect(QUESTIONNAIRE.readWith(sansRegime).validated.toJSON()).toEqual({});
  });
});

describe("la condition d'une question sur les questions validées", () => {
  it("lit une page déjà validée", () => {
    const pages = (answers: Record<string, string | string[]>) =>
      QUESTIONNAIRE.readWith(answers)
        .askedPages()
        .map((page) => page.id);
    expect(pages({ regime: "tout" })).toEqual(["regime", "plats"]);
    expect(pages({ regime: "tout", plats: ["salade"] })).toEqual([
      "regime",
      "plats",
      "dessert",
    ]);
  });

  it("lit la question qui la précède sur sa page, telle qu'elle est à l'écran", async () => {
    const { user } = afficher(PAGES);
    expect(screen.queryByLabelText(/^quelles protéines/i)).toBeNull();

    await user.click(screen.getByRole("radio", { name: "Végétarien" }));

    expect(screen.getByLabelText(/^quelles protéines/i)).toBeInTheDocument();
  });
});
