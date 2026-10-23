// L'aide du patient, lue sur Q1.1 : seul, avec un proche ou avec un
// professionnel. Sans réponse, elle ne dit rien, et sa provenance l'attend.

import { describe, expect, it } from "vitest";
import { AideDuPatient } from "../../../../core/models/eligibilite/concepts/aide-du-patient";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import { GivenAnswers } from "../../../../core/socle/questionnaire-engine/given-answers";
import type { Answers } from "../../../../core/socle/questionnaire-engine/question";

const aide = (reponses: Answers<Questions>) =>
  AideDuPatient.of(new GivenAnswers<Questions>(reponses));

// Seul, avec un proche, avec un professionnel, sans professionnel.
const lecture = (lue: AideDuPatient) => [
  lue.seDeplaceSeul(),
  lue.avecUnProche(),
  lue.avecUnProfessionnel(),
  lue.sansProfessionnel(),
];

describe("l'aide que Q1.1 dit", () => {
  it.each([
    ["1_SEUL", [true, false, false, true]],
    ["2_AVEC_UN_PROCHE", [false, true, false, true]],
    ["3_AVEC_UN_PROFESSIONNEL", [false, false, true, false]],
  ] as const)("%s : %j", (qui, attendu) => {
    expect(lecture(aide({ "Q1.1": qui }))).toEqual(attendu);
  });

  it("sans réponse, aucune aide n'est dite", () => {
    expect(lecture(aide({}))).toEqual([false, false, false, false]);
  });
});

describe("la provenance d'un fait que Q1.1 décide", () => {
  it("cite la réponse", () => {
    expect(aide({ "Q1.1": "2_AVEC_UN_PROCHE" }).provenance()).toBe(
      "Q1.1 : « 2_AVEC_UN_PROCHE ».",
    );
  });

  it("sans réponse, l'attend", () => {
    expect(aide({}).provenance()).toBe("Q1.1 n'est pas encore validée.");
  });
});
