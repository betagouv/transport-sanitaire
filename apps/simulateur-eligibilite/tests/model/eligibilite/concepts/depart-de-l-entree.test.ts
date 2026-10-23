// Le départ d'une entrée en établissement, lu sur Q2.13 : l'entrée simple, qui
// écarte le transfert et le Centre 15, et les départs qui l'ouvrent.

import { describe, expect, it } from "vitest";
import { DepartDeLEntree } from "../../../../core/models/eligibilite/concepts/depart-de-l-entree";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import { GivenAnswers } from "../../../../core/socle/questionnaire-engine/given-answers";
import type { Answers } from "../../../../core/socle/questionnaire-engine/question";

const nonSiEntreeSimple = (reponses: Answers<Questions>) => {
  const fait = DepartDeLEntree.of(
    new GivenAnswers<Questions>(reponses),
  ).nonSiEntreeSimple("la raison du fait.");
  return fait && [fait.value, fait.provenance];
};

describe("une entrée simple", () => {
  it.each([
    "1_DOMICILE",
    "5_HEBERGEMENT_NON_MEDICALISE",
    "6_ETABLISSEMENT_PENITENTIAIRE",
  ] as const)("%s donne « non », avec la raison du fait", (depart) => {
    expect(nonSiEntreeSimple({ "Q2.13.depart": depart })).toEqual([
      false,
      `Q2.13 : « ${depart} » ; la raison du fait.`,
    ]);
  });

  it.each([
    "2_ETABLISSEMENT_DE_SANTE",
    "3_EHPAD",
    "4_USLD",
    "7_AUTRE_LIEU",
  ] as const)("%s laisse la main", (depart) => {
    expect(nonSiEntreeSimple({ "Q2.13.depart": depart })).toBeUndefined();
  });

  it("sans départ, elle laisse la main", () => {
    expect(nonSiEntreeSimple({})).toBeUndefined();
  });
});
