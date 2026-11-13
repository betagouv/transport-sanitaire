// Le brouillon que retrouve la page d'une alerte, à la fin d'une correction
// (ADR-30), se relit sur les réponses corrigées : une question devenue
// inapplicable y perd sa réponse, une option qui ne se propose plus en sort, et
// le reste tient (NAV-SOUS-QUESTIONS-20261113, SQ-24). Les pages sont écrites
// ici.

import { describe, expect, it } from "vitest";
import { givenOf, page, questionsOf } from "../../../core/socle";
import type { CoreModel } from "../../../core/socle/model";
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

const question = questionsOf<Questions>();
const given = givenOf<Questions>();
const DIALYSE = given.question("soin").answer().is("dialyse");

const PAGES = [
  page(
    "soin",
    question
      .singleChoice("soin", "Quel soin ?")
      .options({ dialyse: "Une dialyse", rien: "Rien" }),
  ),
  page(
    "lieu",
    question
      .singleChoice("lieu", "Où ?")
      .options({ hopital: "À l'hôpital", domicile: "À domicile" }),
    question
      .singleChoice("seance", "Quelle séance ?")
      .options({ hemodialyse: "Une hémodialyse", autre: "Une autre" })
      .appliesWhen(DIALYSE),
    question
      .multipleChoice("transport", "Quel transport ?")
      .options({ taxi: "Un taxi", vsl: "Un VSL" })
      .option("vsl", (option) => option.offeredWhen(DIALYSE)),
  ),
] as Page[];

const core: CoreModel = {
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
