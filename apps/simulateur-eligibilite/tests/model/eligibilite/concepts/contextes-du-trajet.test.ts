// Les contextes du trajet, lus sur Q2.1, Q2.2.1 et Q2.2.1.b : les situations
// de l'autre cadre qui se proposent (D-98). Ce que chacune établit se teste
// sur la page des contextes (`contextes.test.ts`).

import { describe, expect, it } from "vitest";
import { ContextesDuTrajet } from "../../../../core/models/eligibilite/concepts/contextes-du-trajet";
import {
  OPTIONS,
  type Questions,
} from "../../../../core/models/eligibilite/declarations/questions";
import { GivenAnswers } from "../../../../core/socle/questionnaire-engine/given-answers";
import type { Answers } from "../../../../core/socle/questionnaire-engine/question";

type Contexte = Questions["Q2.2.1.b"][number];

const CONTEXTES = Object.keys(OPTIONS["Q2.2.1.b"]) as Contexte[];

const aProposer = (reponses: Answers<Questions>) =>
  ContextesDuTrajet.of(new GivenAnswers<Questions>(reponses)).aProposer();
describe("les situations de l'autre cadre à proposer", () => {
  it("toutes, sans motif en Q2.1", () => {
    expect(aProposer({})).toEqual(CONTEXTES);
  });

  it.each([
    ["10_CAMSP", ["6_CAMSP"]],
    ["12_CONVOCATION", ["13_CONVOCATION"]],
    ["13_MATERNITE", ["4_MATERNITE_ELOIGNEE", "5_HTNM"]],
  ] as const)("Q2.1 : %s en retire %j", (motif, retires) => {
    expect(aProposer({ "Q2.1": motif })).toEqual(
      CONTEXTES.filter((contexte) => !retires.includes(contexte as never)),
    );
  });
});
