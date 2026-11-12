// La finalité de soins au-delà de 150 km, Q2.3.1.finalite (TS1018-01) : elle
// se pose sur la page du trajet, après la série et avant l'urgence, quand
// aucune réponse d'avant ne prouve un soin et que sa réponse change l'issue.
//
// Les pages sont lues comme l'écran les lit, filtrage par le graphe compris.

import { describe, expect, it } from "vitest";
import type { Questions } from "../../../../core/models/eligibilite/questions/reponses";
import {
  type Answers,
  pagesOf,
  Questionnaire,
} from "../../../../core/socle/questionnaire-engine";
import { model } from "../../../../front/models/eligibilite";
import { ciblesDe, SANS_SITUATION } from "./reponses-de-la-permission";

describe("la finalité au-delà de 150 km", () => {
  it("se pose pour « Autre motif », après la série et avant l'urgence", () => {
    expect(surLeTrajet(AUTRE_MOTIF)).toEqual([
      "Q2.3.1",
      "Q2.3.2",
      "Q2.3.3",
      "Q2.3.1.finalite",
    ]);
  });

  it("ne se pose pas jusqu'à 150 km inclus", () => {
    expect(
      surLeTrajet({ ...AUTRE_MOTIF, "Q2.3.1": "2_PLUS_DE_CINQUANTE_KM" }),
    ).not.toContain("Q2.3.1.finalite");
  });

  it.each<[string, Reponses]>([
    ["une consultation", { "Q2.1": "1_CONSULTATION" }],
    ["un soin lié à l'ALD", { "Q1.3": ["2_ALD"], "Q1.3.b": "1_LIEN_DIRECT" }],
    ["une seule séance", { "Q1.3": ["3_CHIMIOTHERAPIE"] }],
    ["une série", { "Q2.3.3": "1_OUI" }],
  ])("ne se pose pas après %s, qui la prouve", (_nom, preuve) => {
    expect(surLeTrajet({ ...AUTRE_MOTIF, ...preuve })).not.toContain(
      "Q2.3.1.finalite",
    );
  });

  it("attend sa réponse : pas de résultat avant", () => {
    expect(lire(AUTRE_MOTIF).isComplete()).toBe(false);
    expect(ciblesDe(AUTRE_MOTIF).cible_decision_calculable.value).not.toBe(
      true,
    );
  });

  it("Oui : l'accord préalable, puis l'urgence", () => {
    const oui = { ...AUTRE_MOTIF, "Q2.3.1.finalite": "1_OUI" } as const;
    expect(surLeTrajet(oui)).toContain("Q2.3.4");
    const reponses = { ...oui, "Q2.3.4": "2_NON" } as const;
    expect(lire(reponses).isComplete()).toBe(true);
    expect(ciblesDe(reponses).cible_issue_id.value).toBe(
      "ISSUE_DAP_SANS_URGENCE",
    );
  });

  it("Non : ce seul fondement écarté, le transport n'est pas pris en charge", () => {
    const non = { ...AUTRE_MOTIF, "Q2.3.1.finalite": "2_NON" } as const;
    expect(surLeTrajet(non)).not.toContain("Q2.3.4");
    expect(lire(non).isComplete()).toBe(true);
    expect(ciblesDe(non).cible_issue_id.value).toBe("ISSUE_NON_ELIGIBLE");
  });
});

// ---- implémentation ----

type Reponses = Answers<Questions>;

// Un autre motif, à plus de 150 km, sans série.
const AUTRE_MOTIF: Reponses = {
  ...SANS_SITUATION,
  "Q2.3.1": "3_PLUS_DE_CENT_CINQUANTE_KM",
  "Q2.3.3": "2_NON",
};

const pages = pagesOf(model.core.questionnaire);
const trajet = pages.find(({ id }) => id === "P2/trajet");

const lire = (reponses: Reponses) =>
  new Questionnaire(pages, model.core.relevance).readWith(reponses);

const surLeTrajet = (reponses: Reponses) =>
  trajet
    ? lire(reponses)
        .questionsOn(trajet)
        .map(({ id }) => id)
    : [];
