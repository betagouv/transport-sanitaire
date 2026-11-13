// Une réponse que la validation d'une page rend inapplicable s'efface, sur
// les autres pages aussi : reposée, sa question revient vide
// (NAV-SOUS-QUESTIONS-20261112, SQ-10). Une réponse qui ne se décide pas
// encore, derrière une question en attente, reste. Les pages sont écrites ici.

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
  deplacement: "transfert" | "autre";
  type: "definitif" | "provisoire";
  motif: string;
  precision: string;
};

const question = questionsOf<Questions>();
const given = givenOf<Questions>();

const PAGES = [
  page(
    "deplacement",
    question
      .singleChoice("deplacement", "Quel déplacement ?")
      .options({ transfert: "Un transfert", autre: "Autre chose" }),
  ),
  page(
    "type",
    question
      .singleChoice("type", "Quel type ?")
      .options({ definitif: "Définitif", provisoire: "Provisoire" })
      .appliesWhen(given.question("deplacement").answer().is("transfert")),
  ),
  page("motif", question.text("motif", "Quel motif ?")),
  page(
    "precision",
    question
      .text("precision", "Quelle précision ?")
      .appliesWhen(given.question("motif").answer().isPresent()),
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

describe("une réponse devenue inapplicable", () => {
  it("s'efface à la validation de la page qui l'exclut", () => {
    const corrigee = surLeDeplacement({ ...TRANSFERT, ...MOTIF }).validate({
      deplacement: "autre",
    });

    expect(corrigee.answers).toEqual({ deplacement: "autre", ...MOTIF });
  });

  it("revient vide quand sa question se pose de nouveau", () => {
    const corrigee = surLeDeplacement({ ...TRANSFERT, ...MOTIF }).validate({
      deplacement: "autre",
    });

    const reposee = revenirAuDeplacement(corrigee).validate({
      deplacement: "transfert",
    });

    expect(reposee.page.id).toBe("type");
    expect(reposee.answers).not.toHaveProperty("type");
  });

  it("reste quand sa question attend une réponse d'avant pour se décider", () => {
    const corrigee = surLeDeplacement({
      deplacement: "autre",
      ...MOTIF,
    }).validate({ deplacement: "transfert" });

    expect(corrigee.page.id).toBe("type");
    expect(corrigee.answers).toEqual({ deplacement: "transfert", ...MOTIF });
  });
});

// ---- implémentation ----

const TRANSFERT = { deplacement: "transfert", type: "definitif" };
const MOTIF = { motif: "une greffe", precision: "le matin" };

// Ces réponses, rouvertes sur la première page : le questionnaire rouvert si
// elles mènent au résultat.
const surLeDeplacement = (answers: Answers) =>
  revenirAuDeplacement(Simulation.resume(core, answers).reopen());

function revenirAuDeplacement(simulation: Simulation): Simulation {
  if (simulation.page.id === "deplacement") return simulation;
  return revenirAuDeplacement(simulation.back());
}
