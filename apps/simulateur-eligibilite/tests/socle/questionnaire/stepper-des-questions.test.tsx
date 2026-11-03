import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import type { CoreModel } from "../../../core/socle/model";
import { Simulation } from "../../../core/socle/simulation/simulation";
import { QuestionnaireForm } from "../../../front/socle/questionnaire/QuestionnaireForm";
import { detailsDuStepper } from "../simulateur/questionnaire";

// Le stepper d'une page de questions : le titre de la partie en est le titre,
// et le seul `h1` de l'écran. Il annonce la partie suivante du questionnaire,
// jamais celle qui suivrait la dernière. Les parties sont écrites ici.

type Questions = { boisson: "the" | "cafe"; quantite: number };

const question = questionsOf<Questions>();

const PARTS = [
  {
    id: "boisson",
    title: "La boisson",
    pages: [
      page(
        "boisson",
        question
          .singleChoice("boisson", "Laquelle ?")
          .options({ the: "Un thé", cafe: "Un café" }),
      ),
    ],
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

// Un modèle sans préconisation, sur sa première page.
const CORE: CoreModel = {
  preconisation: { faits: () => ({}), cibles: () => ({}), reads: new Map() },
  questionnaire: PARTS,
  complement: { id: "complement", title: "Complément", pages: [] },
  seeds: async () => [],
};

function afficherDeuxParties() {
  render(<Formulaire />);
  return userEvent.setup();
}

function Formulaire() {
  const [simulation, setSimulation] = useState(() => Simulation.start(CORE));
  return (
    <QuestionnaireForm
      parts={PARTS}
      partCount={3}
      endLabel="Terminer"
      tracked={false}
      simulation={simulation}
      onChange={setSimulation}
    />
  );
}
