import { describe, expect, it } from "vitest";
import {
  answerAbsent,
  answerPresent,
} from "../../../front/socle/questionnaire-engine/answer-presence";

// Une réponse est là, ou ne l'est pas. Une réponse « fausse » est une réponse :
// une case seule décochée, un zéro, un texte vide.

describe("la présence d'une réponse", () => {
  it.each([false, 0, "", "oui", ["a"]])("%j est une réponse", (answer) => {
    expect(answerPresent(answer)).toBe(true);
    expect(answerAbsent(answer)).toBe(false);
  });

  it("undefined n'en est pas une", () => {
    expect(answerPresent(undefined)).toBe(false);
    expect(answerAbsent(undefined)).toBe(true);
  });
});
