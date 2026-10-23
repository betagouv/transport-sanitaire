// Le soin, lu sur Q1.3, Q2.1 et Q2.1.g : le séjour d'une entrée ou d'une
// sortie, le soin sans séance ni séjour, et la séance de P1.

import { describe, expect, it } from "vitest";
import { Soin } from "../../../../core/models/eligibilite/concepts/soin";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import type { Fait } from "../../../../core/socle";
import { GivenAnswers } from "../../../../core/socle/questionnaire-engine/given-answers";
import type { Answers } from "../../../../core/socle/questionnaire-engine/question";

const soin = (reponses: Answers<Questions>) =>
  Soin.of(new GivenAnswers<Questions>(reponses));
const lu = (fait: Fait | undefined) => fait && [fait.value, fait.provenance];

const SANS_SEANCE = { "Q1.3": ["7_AUCUNE"] } as const;

describe("une entrée ou une sortie d'établissement", () => {
  it.each([
    [{ "Q2.1.g": "1_ENTREE" }, [true, "Q2.1.g : « 1_ENTREE »."]],
    [{ "Q2.1.g": "2_SORTIE" }, [true, "Q2.1.g : « 2_SORTIE »."]],
    [{ "Q2.1.g": "3_ADMISSION_HAD" }, undefined],
    [{}, undefined],
  ] as const)("%j : %j", (reponses, attendu) => {
    expect(lu(soin(reponses).parEntreeOuSortie())).toEqual(attendu);
  });
});

describe("le soin sans séance ni séjour", () => {
  it.each([
    [
      { ...SANS_SEANCE, "Q2.1": "1_CONSULTATION" },
      [
        false,
        "Q2.1 : « 1_CONSULTATION », pas une hospitalisation ; Q1.3 sans séance.",
      ],
    ],
    [
      {
        ...SANS_SEANCE,
        "Q2.1": "8_HOSPITALISATION",
        "Q2.1.g": "3_ADMISSION_HAD",
      },
      [
        false,
        "Q2.1.g : « 3_ADMISSION_HAD », pas un séjour ; Q1.3 sans séance.",
      ],
    ],
    [
      { ...SANS_SEANCE, "Q2.1": "8_HOSPITALISATION", "Q2.1.g": "1_ENTREE" },
      undefined,
    ],
    [{ "Q1.3": ["4_RADIOTHERAPIE"], "Q2.1": "1_CONSULTATION" }, undefined],
    [SANS_SEANCE, undefined],
  ] as const)("%j : %j", (reponses, attendu) => {
    expect(lu(soin(reponses).sansSeanceNiSejour())).toEqual(attendu);
  });
});

describe("la séance de P1", () => {
  it("reprend celle des cas particuliers", () => {
    expect(lu(soin({ "Q1.3": ["3_CHIMIOTHERAPIE"] }).seanceDeP1())).toEqual([
      true,
      "Q1.3 : « 3_CHIMIOTHERAPIE » coché.",
    ]);
  });
});
