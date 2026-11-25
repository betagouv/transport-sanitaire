// Le brouillon que retrouve la page d'une alerte, à la fin d'une correction
// (ADR-0041), se relit sur les réponses corrigées : une question devenue
// inapplicable y perd sa réponse, une réponse possible qui ne se propose plus
// en sort, et le reste tient (NAV-SOUS-QUESTIONS-20261113, SQ-24). Les pages
// sont écrites ici.

import { describe, expect, it } from "vitest";
import { page, QuestionFactory, ReadingFactory } from "../../../core/socle";
import type { SimulationModel } from "../../../core/socle/model.types";
import type {
  Answers,
  Page,
  QuestionnairePart,
} from "../../../core/socle/questionnaire-engine";
import { Simulation } from "../../../core/socle/simulation";

type Questions = {
  soin: "dialyse" | "rien";
  lieu: "hopital" | "domicile";
  seance: "hemodialyse" | "autre";
  transport: readonly ("taxi" | "vsl")[];
};

const question = new QuestionFactory<Questions>();
const given = new ReadingFactory<Questions>();
const DIALYSE = given.question("soin").answer().is("dialyse");

const PAGES = [
  page(
    "soin",
    question
      .singleChoice("soin", "Quel soin ?")
      .possibleAnswers({ dialyse: "Une dialyse", rien: "Rien" }),
  ),
  page(
    "lieu",
    question
      .singleChoice("lieu", "Où ?")
      .possibleAnswers({ hopital: "À l'hôpital", domicile: "À domicile" }),
    question
      .singleChoice("seance", "Quelle séance ?")
      .possibleAnswers({ hemodialyse: "Une hémodialyse", autre: "Une autre" })
      .appliesWhen(DIALYSE),
    question
      .multipleChoice("transport", "Quel transport ?")
      .possibleAnswers({ taxi: "Un taxi", vsl: "Un VSL" })
      .possibleAnswer("vsl", (possibleAnswer) =>
        possibleAnswer.offeredWhen(DIALYSE),
      ),
  ),
] as Page[];

const core: SimulationModel = {
  preconisation: { faits: () => ({}), cibles: () => ({}), reads: new Map() },
  questionnaire: [
    { id: "partie", title: "Partie", pages: PAGES },
  ] as QuestionnairePart<never, undefined>[],
  complement: { id: "complement", title: "Complément", pages: [] },
  seeds: async () => [],
};

const BROUILLON: Answers = {
  lieu: "hopital",
  seance: "hemodialyse",
  transport: ["taxi", "vsl"],
};

describe("le brouillon restauré après une correction", () => {
  it("perd ce que la correction rend inapplicable, et garde le reste", () => {
    const retour = corriger(surLeLieu(), BROUILLON, "rien");

    expect(retour.page.id).toBe("lieu");
    expect(retour.restoredDraft).toEqual({
      lieu: "hopital",
      transport: ["taxi"],
    });
  });

  it("ne rend pas une réponse perdue quand une autre correction la repose", () => {
    const retour = corriger(surLeLieu(), BROUILLON, "rien");

    const encore = corriger(retour, retour.restoredDraft, "dialyse");

    expect(encore.restoredDraft).toEqual({
      lieu: "hopital",
      transport: ["taxi"],
    });
  });

  it("revient tel quel si la correction ne change rien de la page", () => {
    const retour = corriger(surLeLieu(), BROUILLON, "dialyse");

    expect(retour.restoredDraft).toEqual(BROUILLON);
  });
});

// ---- implémentation ----

const surLeLieu = () => Simulation.resume(core, { soin: "dialyse" });

// Depuis le lieu, avec ce brouillon : revoir le soin, et le valider.
function corriger(
  simulation: Simulation,
  brouillon: Answers,
  soin: Questions["soin"],
): Simulation {
  const revu = simulation.revisit("soin", brouillon);
  if (!revu) throw new Error("Le soin ne se revoit pas d'ici.");
  return revu.validate({ soin });
}
