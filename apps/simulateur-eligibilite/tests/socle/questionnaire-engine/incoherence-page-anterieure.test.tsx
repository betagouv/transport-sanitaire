import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  areAnswered,
  validatedQuestions,
} from "../../../front/socle/questionnaire-engine/asked-questions";
import type {
  Page,
  Question,
} from "../../../front/socle/questionnaire-engine/question";
import { stateAfterAnswers } from "../../../front/socle/questionnaire-engine/questionnaire";
import { afficher } from "./afficher";

// Une réponse peut en contredire une page antérieure. Le moteur cache à la
// règle les réponses des pages suivantes : elle se déclare sur la plus tardive
// des deux questions. Après le verrou, elle lit les réponses verrouillées. Les
// pages sont écrites ici.

const page = (...questions: Question[]): Page => ({
  id: questions[0]?.id ?? "vide",
  questions,
});

const LIVRAISON: Question = {
  id: "livraison",
  kind: "single choice",
  label: "Comment livrer ?",
  options: [
    { value: "domicile", label: "À domicile" },
    { value: "relais", label: "En point relais" },
  ],
};

const MODE: Question = {
  id: "mode",
  kind: "single choice",
  label: "Comment payer ?",
  options: [
    { value: "carte", label: "Par carte" },
    { value: "especes", label: "En espèces" },
  ],
  inconsistenciesFrom: ({ livraison, mode }) =>
    livraison === "domicile" && mode === "especes"
      ? [
          "Les espèces ne se paient pas à la livraison : revenez à la livraison.",
        ]
      : [],
};

const DEBUT: Question = {
  id: "debut",
  kind: "datetime",
  label: "Début du créneau",
};

const COMMANDE = [page(LIVRAISON), page(MODE), page(DEBUT)];

const precedent = () => screen.getByRole("button", { name: "Précédent" });
const unInstant = () => new Promise((fini) => setTimeout(fini, 300));

describe("réponse qui contredit une page antérieure", () => {
  const MESSAGE =
    "Les espèces ne se paient pas à la livraison : revenez à la livraison.";

  async function contredire() {
    const rendu = afficher(COMMANDE);
    await rendu.user.click(screen.getByLabelText("À domicile"));
    await rendu.user.click(await screen.findByLabelText("En espèces"));
    return rendu;
  }

  it("bloque sa page, avec le message", async () => {
    await contredire();
    await unInstant();

    expect(screen.getByText(MESSAGE)).toBeInTheDocument();
    expect(screen.queryByLabelText("Début du créneau")).toBeNull();
  });

  it("laisse corriger par « Précédent », puis repasser", async () => {
    const { user } = await contredire();

    await user.click(precedent());
    await user.click(screen.getByLabelText("En point relais"));
    await user.click(await screen.findByLabelText("En espèces"));

    expect(screen.queryByText(MESSAGE)).toBeNull();
    expect(
      await screen.findByLabelText("Début du créneau"),
    ).toBeInTheDocument();
  });

  it("rouvre la page sur son message quand la réponse d'origine a changé", () => {
    const reponses = { livraison: "domicile", mode: "especes" };

    expect(stateAfterAnswers(COMMANDE, reponses)).toMatchObject({
      page: "mode",
      complete: false,
    });
  });

  it("n'a pas de message tant que la réponse d'origine ne la contredit pas", () => {
    const reponses = { livraison: "relais", mode: "especes" };

    expect(stateAfterAnswers(COMMANDE, reponses).page).toBe("debut");
  });

  it("ne compte pas la question incohérente parmi les validées", () => {
    const reponses = { livraison: "domicile", mode: "especes" };

    expect(validatedQuestions(COMMANDE, reponses).mode).toBeUndefined();
    expect(areAnswered(COMMANDE, reponses)).toBe(false);
  });
});

describe("règle écrite sur la première des deux questions", () => {
  const PREMIERE: Question = {
    ...LIVRAISON,
    inconsistenciesFrom: ({ mode }) =>
      mode === undefined ? [] : ["Reçoit la réponse de la page suivante."],
  };
  const PAGES = [
    page(PREMIERE),
    page({ ...MODE, inconsistenciesFrom: undefined }),
  ];

  it("ne reçoit pas la réponse de la page suivante", () => {
    const reponses = { livraison: "domicile", mode: "carte" };

    expect(stateAfterAnswers(PAGES, reponses)).toMatchObject({
      page: "mode",
      complete: true,
    });
  });

  it("reçoit pourtant les réponses de sa propre page, brouillon compris", async () => {
    const memePage = page(MODE, {
      ...LIVRAISON,
      inconsistenciesFrom: ({ mode }) =>
        mode === "especes" ? ["Vu sur la même page."] : [],
    });
    const { user } = afficher([memePage]);

    await user.click(screen.getByLabelText("En espèces"));
    await user.click(screen.getByLabelText("À domicile"));

    expect(screen.getByText("Vu sur la même page.")).toBeInTheDocument();
  });
});

describe("après le verrou", () => {
  it("lit les réponses verrouillées", async () => {
    const { user } = afficher([page(MODE)], {
      lockedAnswers: { livraison: "domicile" },
    });

    await user.click(screen.getByLabelText("En espèces"));
    await unInstant();

    expect(
      screen.getByText(/Les espèces ne se paient pas/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("En espèces")).toBeInTheDocument();
  });
});
