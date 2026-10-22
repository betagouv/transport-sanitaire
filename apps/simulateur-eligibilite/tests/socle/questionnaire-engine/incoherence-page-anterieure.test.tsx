import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";
import { afficher } from "./afficher";

// Une réponse peut en contredire une page antérieure. Le moteur cache à la
// règle les réponses des pages suivantes : elle se déclare sur la plus tardive
// des deux questions. Après le verrou, elle lit les réponses verrouillées. Les
// pages sont écrites ici.

type Questions = {
  livraison: "domicile" | "relais";
  mode: "carte" | "especes";
  debut: string;
};

const OPTIONS = {
  livraison: { domicile: "À domicile", relais: "En point relais" },
  mode: { carte: "Par carte", especes: "En espèces" },
} as const;

const question = questionsOf<Questions>({ options: OPTIONS });

const LIVRAISON = question.singleChoice("livraison", "Comment livrer ?");

// Le mode de paiement, sans règle.
const PAIEMENT = question.singleChoice("mode", "Comment payer ?");

const MODE = PAIEMENT.inconsistentIf(
  ({ answers }) =>
    answers.question("livraison").is("domicile") &&
    answers.question("mode").is("especes"),
  "Les espèces ne se paient pas à la livraison : revenez à la livraison.",
);

const DEBUT = question.datetime("debut", "Début du créneau");

const COMMANDE = [
  page("livraison", LIVRAISON),
  page("mode", MODE),
  page("debut", DEBUT),
];

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

    const lecture = new Questionnaire(COMMANDE).readWith(reponses);
    expect(lecture.openPage().id).toBe("mode");
    expect(lecture.isComplete()).toBe(false);
  });

  it("n'a pas de message tant que la réponse d'origine ne la contredit pas", () => {
    const reponses = { livraison: "relais", mode: "especes" };

    expect(new Questionnaire(COMMANDE).readWith(reponses).openPage().id).toBe(
      "debut",
    );
  });

  it("ne compte pas la question incohérente parmi les validées", () => {
    const reponses = { livraison: "domicile", mode: "especes" };

    const lecture = new Questionnaire(COMMANDE).readWith(reponses);
    expect(lecture.validated.toJSON().mode).toBeUndefined();
    expect(lecture.isComplete()).toBe(false);
  });
});

describe("règle écrite sur la première des deux questions", () => {
  const PREMIERE = LIVRAISON.inconsistentIf(
    ({ answers }) => answers.question("mode").hasAnswer(),
    "Reçoit la réponse de la page suivante.",
  );
  const PAGES = [page("livraison", PREMIERE), page("mode", PAIEMENT)];

  it("ne reçoit pas la réponse de la page suivante", () => {
    const reponses = { livraison: "domicile", mode: "carte" };

    const lecture = new Questionnaire(PAGES).readWith(reponses);
    expect(lecture.openPage().id).toBe("mode");
    expect(lecture.isComplete()).toBe(true);
  });

  it("reçoit pourtant les réponses de sa propre page, brouillon compris", async () => {
    const memePage = page(
      "mode",
      MODE,
      LIVRAISON.inconsistentIf(
        ({ answers }) => answers.question("mode").is("especes"),
        "Vu sur la même page.",
      ),
    );
    const { user } = afficher([memePage]);

    await user.click(screen.getByLabelText("En espèces"));
    await user.click(screen.getByLabelText("À domicile"));

    expect(screen.getByText("Vu sur la même page.")).toBeInTheDocument();
  });
});

describe("après le verrou", () => {
  it("lit les réponses verrouillées", async () => {
    const { user } = afficher([page("mode", MODE)], {
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
