import { describe, expect, it } from "vitest";
import type { Page } from "../../../core/socle/questionnaire-engine/question";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";

// Après le verrou, une question peut dépendre de la préconisation : sa condition
// lit les cibles figées, en plus des réponses. Le questionnaire factice n'a pas
// de telle question, les pages sont donc écrites ici.

const TOUJOURS: Page = {
  id: "adresse",
  questions: [{ id: "adresse", kind: "text", label: "Adresse" }],
};

const SI_URGENCE: Page = {
  id: "urgence",
  questions: [
    {
      id: "precision",
      kind: "text",
      label: "Précision sur l'urgence",
      askedIf: ({ cibles }) => cibles?.urgence === true,
    },
  ],
};

const affichees = (cibles: Record<string, unknown>) =>
  new Questionnaire([TOUJOURS, SI_URGENCE])
    .readWith({}, cibles)
    .askedPages()
    .map((page) => page.id);

describe("condition d'une question sur les cibles", () => {
  it("pose la question quand la cible le demande", () => {
    expect(affichees({ urgence: true })).toEqual(["adresse", "urgence"]);
  });

  it("ne la pose pas sinon", () => {
    expect(affichees({ urgence: false })).toEqual(["adresse"]);
  });
});

// Un modèle demande au socle si une de ses parties est complète : c'est un fait
// que ses règles attendent.

const DOULEUR: Page = {
  id: "douleur",
  questions: [
    {
      id: "douleur",
      kind: "single choice",
      label: "Avez-vous mal ?",
      options: [
        { value: "oui", label: "Oui" },
        { value: "non", label: "Non" },
      ],
    },
    {
      id: "endroit",
      kind: "text",
      label: "Où ?",
      askedIf: ({ answers }) => answers.question("douleur").is("oui"),
    },
  ],
};

const repondu = (reponses: Record<string, string>) =>
  new Questionnaire([DOULEUR]).readWith(reponses).isComplete();

describe("pages auxquelles tout est répondu", () => {
  it("le sont quand chaque question posée a sa réponse", () => {
    expect(repondu({ douleur: "oui", endroit: "Au dos" })).toBe(true);
  });

  it("le sont sans réponse à une question qui ne se pose pas", () => {
    expect(repondu({ douleur: "non" })).toBe(true);
  });

  it("ne le sont pas tant qu'une question posée attend", () => {
    expect(repondu({ douleur: "oui" })).toBe(false);
  });

  it("ne le sont pas pour une réponse hors des options", () => {
    expect(repondu({ douleur: "peut-être" })).toBe(false);
  });
});
