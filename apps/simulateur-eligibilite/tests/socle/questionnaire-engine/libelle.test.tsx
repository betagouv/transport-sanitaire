import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// Le libellé d'une question peut dépendre des réponses. Le questionnaire
// factice n'en a pas de tel, les pages sont donc écrites ici.

type Questions = {
  compagnie: "seul" | "accompagne";
  heure: string;
  duree: string;
};

const OPTIONS = {
  compagnie: { seul: "Seul", accompagne: "Accompagné" },
} as const;

const question = questionsOf<Questions>({ options: OPTIONS });

const COMPAGNIE = page(
  "compagnie",
  question.singleChoice("compagnie", "Venez-vous seul ?"),
);

const HEURE = page(
  "heure",
  question
    .text("heure", "À quelle heure arrivez-vous ?")
    .labelFrom(({ answers }) =>
      answers.question("compagnie").is("accompagne")
        ? "À quelle heure arrivez-vous, vous et votre proche ?"
        : "À quelle heure arrivez-vous, seul ?",
    ),
);

const DUREE = page("duree", question.text("duree", "Pour combien de temps ?"));

const radio = (name: string) => screen.getByRole("radio", { name });

describe("libellé qui dépend des réponses", () => {
  it("suit la réponse donnée", async () => {
    const { user } = afficher([COMPAGNIE, HEURE]);

    await user.click(radio("Accompagné"));

    expect(
      await screen.findByRole("textbox", {
        name: "À quelle heure arrivez-vous, vous et votre proche ?",
      }),
    ).toBeInTheDocument();
  });

  it("change quand la réponse change", async () => {
    const { user } = afficher([COMPAGNIE, HEURE]);
    await user.click(radio("Accompagné"));
    await screen.findByRole("textbox");
    await user.click(screen.getByRole("button", { name: "Précédent" }));

    await user.click(radio("Seul"));

    expect(
      await screen.findByRole("textbox", {
        name: "À quelle heure arrivez-vous, seul ?",
      }),
    ).toBeInTheDocument();
  });

  it("reste le libellé déclaré pour une question qui n'en dit rien", async () => {
    afficher([DUREE]);

    expect(
      screen.getByRole("textbox", { name: "Pour combien de temps ?" }),
    ).toBeInTheDocument();
  });
});
