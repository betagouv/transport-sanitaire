// La distance du trajet, lue sur Q2.3.1 : les seuils de 50 et 150 km qu'elle
// dépasse, et la tranche où la série ne se pose pas.

import { describe, expect, it } from "vitest";
import { DistanceDuTrajet } from "../../../../core/models/eligibilite/concepts/distance-du-trajet";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import type { Fait } from "../../../../core/socle";
import { GivenAnswers } from "../../../../core/socle/questionnaire-engine/given-answers";

type Tranche = Questions["Q2.3.1"];

const distance = (tranche?: Tranche) =>
  DistanceDuTrajet.of(
    new GivenAnswers<Questions>(tranche ? { "Q2.3.1": tranche } : {}),
  );
const lu = (fait: Fait) => [fait.value, fait.provenance];
const source = (tranche: Tranche) => `Q2.3.1 : « ${tranche} ».`;

describe("les seuils que la distance dépasse", () => {
  it.each([
    ["1_CINQUANTE_KM_OU_MOINS", false, false],
    ["2_PLUS_DE_CINQUANTE_KM", true, false],
    ["3_PLUS_DE_CENT_CINQUANTE_KM", true, true],
  ] as const)("%s : 50 km %s, 150 km %s", (tranche, plus50, plus150) => {
    expect(lu(distance(tranche).depasseCinquanteKm())).toEqual([
      plus50,
      source(tranche),
    ]);
    expect(lu(distance(tranche).depasseCentCinquanteKm())).toEqual([
      plus150,
      source(tranche),
    ]);
  });

  it("aucun, tant que Q2.3.1 n'a pas de réponse", () => {
    const attendu = [undefined, "Q2.3.1 n'est pas encore validée."];
    expect(lu(distance().depasseCinquanteKm())).toEqual(attendu);
    expect(lu(distance().depasseCentCinquanteKm())).toEqual(attendu);
  });
});

describe("la tranche où la série ne se pose pas", () => {
  it.each([
    ["1_CINQUANTE_KM_OU_MOINS", true],
    ["2_PLUS_DE_CINQUANTE_KM", false],
    [undefined, false],
  ] as const)("%s : %s", (tranche, attendu) => {
    expect(distance(tranche).estDeCinquanteKmOuMoins()).toBe(attendu);
  });
});
