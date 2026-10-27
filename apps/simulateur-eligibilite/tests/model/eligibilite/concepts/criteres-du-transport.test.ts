// Les critères du transport, lus sur Q1.2 : le fait d'un critère, coché ou
// non, et « non » quand Q1.2 ne se pose pas ; et le premier critère coché.

import { describe, expect, it } from "vitest";
import { CriteresDuTransport } from "../../../../core/models/eligibilite/concepts/criteres-du-transport";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import type { Fait } from "../../../../core/socle";
import { GivenAnswers } from "../../../../core/socle/questionnaire-engine/given-answers";
import type { Answers } from "../../../../core/socle/questionnaire-engine/question";

const criteres = (reponses: Answers<Questions>) =>
  CriteresDuTransport.of(new GivenAnswers<Questions>(reponses));
const lu = (fait: Fait) => [fait.value, fait.provenance];
const PRO = { "Q1.1": "3_AVEC_UN_PROFESSIONNEL" } as const;

describe("le fait d'un critère", () => {
  it.each([
    [
      { ...PRO, "Q1.2": ["2_AIDE_TECHNIQUE"] },
      [true, "Q1.2 : « 2_AIDE_TECHNIQUE » coché."],
    ],
    [
      { ...PRO, "Q1.2": ["7_ALLONGE"] },
      [false, "Q1.2 validée sans « 1_PAS_AUTONOME », « 2_AIDE_TECHNIQUE »."],
    ],
    [
      { "Q1.1": "2_AVEC_UN_PROCHE" },
      [false, "Q1.2 ne se pose pas : aucun professionnel n'intervient."],
    ],
    [PRO, [undefined, "Q1.2 n'est pas encore validée."]],
  ] as const)("%j : %j", (reponses, attendu) => {
    expect(
      lu(criteres(reponses).fait("1_PAS_AUTONOME", "2_AIDE_TECHNIQUE")),
    ).toEqual(attendu);
  });
});

describe("le premier critère coché", () => {
  it("est le premier de la réponse", () => {
    expect(
      criteres({
        ...PRO,
        "Q1.2": ["5_RISQUE_DE_MALAISE", "9_SURVEILLANCE"],
      }).premier(),
    ).toBe("5_RISQUE_DE_MALAISE");
  });

  it("sans réponse, manque", () => {
    expect(criteres(PRO).premier()).toBeUndefined();
  });
});
