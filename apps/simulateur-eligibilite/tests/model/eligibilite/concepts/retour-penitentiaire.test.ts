// Le retour pénitentiaire, lu sur Q2.2.1, Q2.2.1.b, Q2.1.g et Q2.2.1.a : coché
// ou non, et la sortie définitive vers la prison (TS1012-04).

import { describe, expect, it } from "vitest";
import { RetourPenitentiaire } from "../../../../core/models/eligibilite/concepts/retour-penitentiaire";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import { GivenAnswers } from "../../../../core/socle/questionnaire-engine/given-answers";
import type { Answers } from "../../../../core/socle/questionnaire-engine/question";

const retour = (reponses: Answers<Questions>) =>
  RetourPenitentiaire.of(new GivenAnswers<Questions>(reponses));

const COCHE: Answers<Questions> = {
  "Q2.2.1": ["3_AUTRE_CADRE"],
  "Q2.2.1.b": ["10_RETOUR_PENITENTIAIRE"],
};

describe("le retour coché", () => {
  it.each([
    [COCHE, true],
    [{ "Q2.2.1": ["3_AUTRE_CADRE"], "Q2.2.1.b": ["1_ATMP"] }, false],
    [{ "Q2.2.1.b": ["10_RETOUR_PENITENTIAIRE"] }, false],
    [{}, false],
  ] as const)("%j : %s", (reponses, attendu) => {
    expect(retour(reponses).estCoche()).toBe(attendu);
  });
});

describe("la sortie définitive vers la prison", () => {
  it.each([
    ["une sortie", { ...COCHE, "Q2.1.g": "2_SORTIE" }, true],
    [
      "une sortie hors permission",
      { ...COCHE, "Q2.1.g": "2_SORTIE", "Q2.2.1.a": "2_NON" },
      true,
    ],
    [
      "une permission",
      { ...COCHE, "Q2.1.g": "2_SORTIE", "Q2.2.1.a": "1_OUI" },
      false,
    ],
    ["une entrée", { ...COCHE, "Q2.1.g": "1_ENTREE" }, false],
    ["une sortie sans retour", { "Q2.1.g": "2_SORTIE" }, false],
  ] as const)("%s : %s", (_, reponses, attendu) => {
    expect(retour(reponses).estUneSortieVersLaPrison()).toBe(attendu);
  });

  it("donne « non » au transfert, au Centre 15 et à la permission", () => {
    const fait = retour({
      ...COCHE,
      "Q2.1.g": "2_SORTIE",
    }).nonSiSortieVersLaPrison();
    expect([fait?.value, fait?.provenance]).toEqual([
      false,
      "Q2.1.g : « 2_SORTIE », Q2.2.1.b : « 10_RETOUR_PENITENTIAIRE » ; sortie définitive vers la prison.",
    ]);
  });

  it("sans elle, la main passe", () => {
    expect(retour(COCHE).nonSiSortieVersLaPrison()).toBeUndefined();
  });
});
