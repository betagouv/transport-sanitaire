import { describe, expect, it } from "vitest";
import { QuestionFactory } from "../../../core/socle";
import { QuestionId } from "../../../core/socle/questionnaire-engine/question/question-id.vo";

// Une question se désigne par son objet dans les déclarations d'un modèle, par
// son id ailleurs. `QuestionId` donne le même id des deux façons.

const DOULEUR = new QuestionFactory().text("douleur", "Où avez-vous mal ?");

describe("l'id d'une question", () => {
  it("se tire de son id", () => {
    expect(QuestionId.of("douleur").value).toBe("douleur");
  });

  it("se tire de la question elle-même", () => {
    expect(QuestionId.of(DOULEUR).value).toBe("douleur");
  });

  it("est égal à un autre id de la même question", () => {
    expect(QuestionId.of(DOULEUR).equals(QuestionId.of("douleur"))).toBe(true);
    expect(QuestionId.of(DOULEUR).equals(QuestionId.of("endroit"))).toBe(false);
  });

  it("ne change pas", () => {
    const id = QuestionId.of("douleur");
    expect(() => Object.assign(id, { value: "endroit" })).toThrow(TypeError);
  });

  it("s'écrit comme son id", () => {
    expect(`${QuestionId.of(DOULEUR)}`).toBe("douleur");
  });
});
