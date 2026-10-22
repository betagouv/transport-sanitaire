import { describe, expect, it } from "vitest";
import type { ValidatedAnswers } from "../../front/socle";
import { type Model, preconisationOf } from "../../front/socle/model";
import { modeleDeTest } from "./modele-de-test";

// La préconisation va des réponses aux faits, puis aux cibles. Pour ses faits,
// le modèle reçoit aussi les questions validées : il y lit ce qui se proposait,
// pour ne pas dire « non » d'une case qu'on n'a jamais montrée.

// Ce que le modèle lit d'une question validée : ce qui s'y proposait, et sa
// réponse.
const lue = (validated: ValidatedAnswers, id: string) => {
  const question = validated.question(id);
  if (!question.isValidated()) return "non validée";
  return { offered: question.offeredOptions(), answer: question.value };
};

// Un modèle dont les faits sont ce qu'il lit, pour le lire ici.
const model: Model = {
  ...modeleDeTest,
  preconisation: {
    faits: (_, validated) => ({
      boisson: lue(validated, "boisson"),
      accompagnements: lue(validated, "accompagnements"),
      quantite: lue(validated, "quantite"),
    }),
    cibles: () => ({}),
  },
};

describe("le calcul des faits", () => {
  it("reçoit les questions validées, avec ce qui s'y proposait", () => {
    const answers = { boisson: "the", accompagnements: ["lait"] };
    expect(preconisationOf(model, answers).faits).toEqual({
      boisson: { offered: ["the", "cafe", "rien"], answer: "the" },
      accompagnements: {
        offered: ["lait", "sucre", "aucun"],
        answer: ["lait"],
      },
      quantite: "non validée",
    });
  });

  it("ne reçoit pas une question qui ne s'est pas posée", () => {
    expect(preconisationOf(model, { boisson: "rien" }).faits).toEqual({
      boisson: { offered: ["the", "cafe", "rien"], answer: "rien" },
      accompagnements: "non validée",
      quantite: "non validée",
    });
  });

  it("ne reçoit pas les questions d'après le verrou", () => {
    const answers = { boisson: "the", accompagnements: ["aucun"], quantite: 2 };
    expect(preconisationOf(model, answers).faits).toMatchObject({
      quantite: "non validée",
    });
  });
});
