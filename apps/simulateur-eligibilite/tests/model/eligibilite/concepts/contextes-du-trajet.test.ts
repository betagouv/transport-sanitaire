// Les contextes du trajet, lus sur Q2.1, Q2.2.1 et Q2.2.1.b : les situations
// de l'autre cadre qui se proposent (D-98), et ce que chacune établit.

import { describe, expect, it } from "vitest";
import { ContextesDuTrajet } from "../../../../core/models/eligibilite/concepts/contextes-du-trajet";
import {
  OPTIONS,
  type Questions,
} from "../../../../core/models/eligibilite/declarations/questions";
import type { Fait } from "../../../../core/socle";
import { GivenAnswers } from "../../../../core/socle/questionnaire-engine/given-answers";
import type {
  Answers,
  Validated,
} from "../../../../core/socle/questionnaire-engine/question";
import { ValidatedAnswers } from "../../../../core/socle/questionnaire-engine/validated-answers";

type Contexte = Questions["Q2.2.1.b"][number];

const CONTEXTES = Object.keys(OPTIONS["Q2.2.1.b"]) as Contexte[];
const GROUPES: Questions["Q2.2.1"] = [
  "1_HOSPITALISATION",
  "2_ETRANGER",
  "3_AUTRE_CADRE",
  "4_AUCUNE",
];

const aProposer = (reponses: Answers<Questions>) =>
  ContextesDuTrajet.of(new GivenAnswers<Questions>(reponses)).aProposer();
const situation = (
  entrees: Validated<Questions>,
  contexte: Exclude<Contexte, "10_RETOUR_PENITENTIAIRE">,
) => {
  const fait = ContextesDuTrajet.of(
    new ValidatedAnswers<Questions>(entrees),
  ).situation(contexte);
  return fait && lu(fait);
};
const lu = (fait: Fait) => [fait.value, fait.provenance];

const groupe = (coches: Questions["Q2.2.1"], offered = GROUPES) => ({
  "Q2.2.1": { offered: [...offered], answer: coches },
});
const autreCadre = (coches: readonly Contexte[], offered = CONTEXTES) => ({
  ...groupe(["3_AUTRE_CADRE"]),
  "Q2.2.1.b": { offered: [...offered], answer: [...coches] },
});

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

describe("ce qu'une situation de l'autre cadre établit", () => {
  it.each([
    [
      "l'autre cadre écarté",
      groupe(["4_AUCUNE"]),
      "1_ATMP",
      [false, "Q2.2.1 : « autre situation » proposée, non cochée."],
    ],
    [
      "la situation cochée",
      autreCadre(["1_ATMP"]),
      "1_ATMP",
      [true, "Q2.2.1.b : « 1_ATMP »."],
    ],
    [
      "la situation proposée, non cochée",
      autreCadre(["1_ATMP"]),
      "7_SAMSAH",
      [false, "Q2.2.1.b : « 7_SAMSAH » proposée, non cochée."],
    ],
    [
      "la maternité cochée",
      autreCadre(["4_MATERNITE_ELOIGNEE"]),
      "4_MATERNITE_ELOIGNEE",
      [
        undefined,
        "Q2.2.1.b : « 4_MATERNITE_ELOIGNEE ». À qualifier dans sa branche.",
      ],
    ],
    [
      "la situation qui ne se proposait pas",
      autreCadre(["1_ATMP"], ["1_ATMP", "7_SAMSAH"]),
      "6_CAMSP",
      undefined,
    ],
    [
      "la situation que Q2.1 indique déjà",
      { "Q2.1": { answer: "10_CAMSP" }, ...groupe(["4_AUCUNE"]) },
      "6_CAMSP",
      undefined,
    ],
    [
      "l'autre cadre coché, sans précision",
      groupe(["3_AUTRE_CADRE"]),
      "1_ATMP",
      undefined,
    ],
    [
      "l'autre cadre qui ne se proposait pas",
      groupe(["4_AUCUNE"], ["2_ETRANGER", "4_AUCUNE"]),
      "1_ATMP",
      undefined,
    ],
  ] as const)("%s", (_, entrees, contexte, attendu) => {
    expect(situation(entrees as Validated<Questions>, contexte)).toEqual(
      attendu,
    );
  });
});
