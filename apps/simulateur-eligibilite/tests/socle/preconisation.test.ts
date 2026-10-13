import { describe, expect, it } from "vitest";
import { type Model, preconisationOf } from "../../front/socle/model";
import { modeleDeTest } from "./modele-de-test";

// La préconisation va des réponses aux faits, puis aux cibles. Pour ses faits,
// le modèle reçoit aussi les questions validées : il y lit ce qui se proposait,
// pour ne pas dire « non » d'une case qu'on n'a jamais montrée.

// Un modèle dont les faits sont ce qu'il reçoit, pour le lire ici.
const model: Model = {
  ...modeleDeTest,
  preconisation: { faits: (_, validated) => validated, cibles: () => ({}) },
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
    });
  });

  it("ne reçoit pas une question qui ne s'est pas posée", () => {
    expect(preconisationOf(model, { boisson: "rien" }).faits).toEqual({
      boisson: { offered: ["the", "cafe", "rien"], answer: "rien" },
    });
  });

  it("ne reçoit pas les questions d'après le verrou", () => {
    const answers = { boisson: "the", accompagnements: ["aucun"], quantite: 2 };
    expect(preconisationOf(model, answers).faits).not.toHaveProperty(
      "quantite",
    );
  });
});
