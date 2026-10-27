import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { givenOf, page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// Une option peut ne se proposer que pour certaines réponses. Le questionnaire
// factice n'en a pas, les pages sont donc écrites ici.

type Questions = {
  regime: "tout" | "vegetarien";
  plats: readonly ("salade" | "steak" | "rien")[];
  dessert: string;
};

const OPTIONS = {
  regime: { tout: "Je mange de tout", vegetarien: "Végétarien" },
  plats: { salade: "Une salade", steak: "Un steak", rien: "Rien" },
} as const;

const question = questionsOf<Questions>({ options: OPTIONS });
const given = givenOf<Questions>();

const REGIME = page(
  "regime",
  question.singleChoice("regime", "Quel est votre régime ?"),
);

const PLATS = page(
  "plats",
  question
    .multipleChoice("plats", "Quels plats ?")
    .exclusive("rien")
    .option("steak", (option) =>
      option.offeredWhen(given.question("regime").answer().is("tout")),
    ),
);

const DESSERT = page("dessert", question.text("dessert", "Quel dessert ?"));

const PLATS_POSES = { name: /^quels plats/i };
const radio = (name: string) => screen.getByRole("radio", { name });
const caseACocher = (name: string) => screen.getByRole("checkbox", { name });
const bouton = (name: string) => screen.getByRole("button", { name });

describe("option qui dépend des réponses", () => {
  it("se propose quand les réponses le permettent", async () => {
    const { user } = afficher([REGIME, PLATS]);

    await user.click(radio("Je mange de tout"));

    await screen.findByRole("group", PLATS_POSES);
    expect(caseACocher("Un steak")).toBeInTheDocument();
  });

  it("ne se propose pas sinon", async () => {
    const { user } = afficher([REGIME, PLATS]);

    await user.click(radio("Végétarien"));

    await screen.findByRole("group", PLATS_POSES);
    expect(screen.queryByRole("checkbox", { name: "Un steak" })).toBeNull();
    expect(caseACocher("Une salade")).toBeInTheDocument();
  });

  it("quitte la réponse quand elle ne se propose plus", async () => {
    const { user, reponses } = afficher([REGIME, PLATS, DESSERT]);
    await user.click(radio("Je mange de tout"));
    await screen.findByRole("group", PLATS_POSES);
    await user.click(caseACocher("Une salade"));
    await user.click(caseACocher("Un steak"));
    await user.click(bouton("Suivant"));

    await user.click(bouton("Précédent"));
    await user.click(bouton("Précédent"));
    await user.click(radio("Végétarien"));
    await screen.findByRole("group", PLATS_POSES);
    await user.click(bouton("Suivant"));
    await user.type(screen.getByRole("textbox"), "Une tarte");
    await user.click(bouton("Terminer"));

    expect(reponses()).toEqual({
      regime: "vegetarien",
      plats: ["salade"],
      dessert: "Une tarte",
    });
  });

  it("laisse la question sans réponse quand il n'en reste rien", async () => {
    const { user } = afficher([REGIME, PLATS, DESSERT]);
    await user.click(radio("Je mange de tout"));
    await screen.findByRole("group", PLATS_POSES);
    await user.click(caseACocher("Un steak"));
    await user.click(bouton("Suivant"));

    await user.click(bouton("Précédent"));
    await user.click(bouton("Précédent"));
    await user.click(radio("Végétarien"));

    await screen.findByRole("group", PLATS_POSES);
    expect(bouton("Suivant")).toBeDisabled();
  });
});
