// Les cas particuliers, lus sur Q1.3 et Q1.3.a : le fait d'un cas, celui de
// l'ALD et du mineur, qui demandent une déficience, et les séances.

import { describe, expect, it } from "vitest";
import { CasParticuliers } from "../../../../core/models/eligibilite/concepts/cas-particuliers";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import type { Fait } from "../../../../core/socle";
import { GivenAnswers } from "../../../../core/socle/questionnaire-engine/given-answers";
import type { Answers } from "../../../../core/socle/questionnaire-engine/question";

const cas = (reponses: Answers<Questions>) =>
  CasParticuliers.of(new GivenAnswers<Questions>(reponses));
const lu = (fait: Fait) => [fait.value, fait.provenance];

describe("le fait d'un cas", () => {
  it.each([
    [
      { "Q1.3": ["6_PARTAGE_INCOMPATIBLE"] },
      [true, "Q1.3 : « 6_PARTAGE_INCOMPATIBLE » coché."],
    ],
    [
      { "Q1.3": ["7_AUCUNE"] },
      [false, "Q1.3 validée sans « 6_PARTAGE_INCOMPATIBLE »."],
    ],
    [{}, [undefined, "Q1.3 n'est pas encore validée."]],
  ] as const)("%j : %j", (reponses, attendu) => {
    expect(lu(cas(reponses).coche("6_PARTAGE_INCOMPATIBLE"))).toEqual(attendu);
  });
});

describe("l'ALD, avec la preuve d'une déficience", () => {
  const ALD = { "Q1.3": ["2_ALD"] } as const;

  it.each([
    [
      { ...ALD, "Q1.1": "2_AVEC_UN_PROCHE" },
      [
        true,
        "Q1.3 : « 2_ALD » coché. Q1.1 : l'aide d'un proche est nécessaire.",
      ],
    ],
    [
      { ...ALD, "Q1.1": "1_SEUL" },
      [false, "Q1.3 : « 2_ALD » coché. Q1.1 : le patient se déplace seul."],
    ],
    [
      { ...ALD, "Q1.1": "3_AVEC_UN_PROFESSIONNEL", "Q1.2": ["4_HYGIENE"] },
      [true, "Q1.3 : « 2_ALD » coché. Q1.2 : « 4_HYGIENE » coché."],
    ],
    [
      ALD,
      [
        undefined,
        "Q1.3 : « 2_ALD » coché. Ni Q1.1 ni Q1.2 n'établissent encore une déficience.",
      ],
    ],
    [
      { "Q1.3": ["7_AUCUNE"], "Q1.1": "2_AVEC_UN_PROCHE" },
      [false, "Q1.3 validée sans « 2_ALD »."],
    ],
  ] as const)("%j : %j", (reponses, attendu) => {
    expect(lu(cas(reponses).fondement("2_ALD"))).toEqual(attendu);
  });
});

describe("la séance qualifiante de P1", () => {
  it.each([
    [
      { "Q1.3": ["4_RADIOTHERAPIE"] },
      [true, "Q1.3 : « 4_RADIOTHERAPIE » coché."],
    ],
    [
      { "Q1.3": ["5_DIALYSE"], "Q1.3.a": "1_OUI" },
      [true, "Q1.3.a : une séance d'hémodialyse."],
    ],
    [
      { "Q1.3": ["5_DIALYSE"], "Q1.3.a": "3_NE_SAIT_PAS" },
      [undefined, "Aucune séance qualifiante en P1 : Q2.1.g décidera."],
    ],
    [{}, [undefined, "Q1.3 n'est pas encore validée."]],
  ] as const)("%j : %j", (reponses, attendu) => {
    expect(lu(cas(reponses).seance())).toEqual(attendu);
  });
});

describe("Q1.3 sans séance qualifiante", () => {
  it.each([
    [{ "Q1.3": ["7_AUCUNE"] }, true],
    [{ "Q1.3": ["3_CHIMIOTHERAPIE"] }, false],
    [{ "Q1.3": ["5_DIALYSE"], "Q1.3.a": "2_AUTRE_DIALYSE" }, true],
    [{ "Q1.3": ["3_CHIMIOTHERAPIE", "5_DIALYSE"] }, false],
    [{ "Q1.3": ["5_DIALYSE"], "Q1.3.a": "1_OUI" }, false],
    [{}, false],
  ] as const)("%j : %s", (reponses, attendu) => {
    expect(cas(reponses).sansSeance()).toBe(attendu);
  });
});
