import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import { QuestionnaireForm } from "../../../front/socle/questionnaire-engine/QuestionnaireForm";
import { detailsDuStepper } from "../simulateur/questionnaire";

// Le stepper d'une page de questions : le titre de la partie en est le titre,
// et le seul `h1` de l'écran. Il annonce la partie suivante du questionnaire,
// jamais celle qui suivrait la dernière. Les parties sont écrites ici.

type Questions = { boisson: "the" | "cafe"; quantite: number };

const OPTIONS = { boisson: { the: "Un thé", cafe: "Un café" } } as const;

const question = questionsOf<Questions>({ options: OPTIONS });

const PARTS = [
  {
    id: "boisson",
    title: "La boisson",
    pages: [page("boisson", question.singleChoice("boisson", "Laquelle ?"))],
  },
  {
    id: "quantite",
    title: "La quantité",
    pages: [page("quantite", question.number("quantite", "Combien ?"))],
  },
];

describe("le stepper des pages de questions", () => {
  it("prend le titre de la partie, seul titre de l'écran", () => {
    afficherDeuxParties();

    expect(
      screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent),
    ).toEqual(["La boisson Étape 1 sur 3"]);
  });

  it("annonce la partie suivante", () => {
    afficherDeuxParties();

    expect(detailsDuStepper()).toBe("Étape suivante : La quantité");
  });

  it("n'annonce rien sur la dernière partie : ce qui suit dépend du résultat", async () => {
    const user = afficherDeuxParties();

    await user.click(screen.getByRole("radio", { name: "Un thé" }));

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "La quantité Étape 2 sur 3",
      }),
    ).toBeInTheDocument();
    expect(detailsDuStepper()).toBeUndefined();
  });
});

// ---- implémentation ----

function afficherDeuxParties() {
  render(
    <QuestionnaireForm
      parts={PARTS}
      partCount={3}
      endLabel="Terminer"
      tracked={false}
      onComplete={() => {}}
    />,
  );
  return userEvent.setup();
}
