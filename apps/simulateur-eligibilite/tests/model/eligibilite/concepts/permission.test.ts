// La permission, lue sur des réponses données : la tranche d'âge de Q2.7 et la
// répétition de Q2.8.5 (D-107). Les contrôles de dates de Q2.8 se testent sur leur page
// (`dates-de-la-permission.test.ts`).

import { describe, expect, it } from "vitest";
import { Permission } from "../../../../core/models/eligibilite/concepts/permission";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import { GivenAnswers } from "../../../../core/socle/questionnaire-engine/given-answers";
import type { Answers } from "../../../../core/socle/questionnaire-engine/question";

const permission = (reponses: Answers<Questions>) =>
  Permission.of(new GivenAnswers<Questions>(reponses));

describe("la tranche d'âge de Q2.7", () => {
  it.each([
    ["1_MOINS_DE_SEIZE_ANS", true, false],
    ["2_SEIZE_A_DIX_NEUF_ANS", true, false],
    ["3_ADULTE_AUTORISEE", false, false],
    ["4_ADULTE_A_SA_CHARGE", false, true],
  ] as const)("%s : mineur %s, à sa charge %s", (tranche, mineur, charge) => {
    const lue = permission({ "Q2.7": tranche });
    expect(lue.estDUnMineurDeVingtAns()).toBe(mineur);
    expect(lue.estAChargeDuPatient()).toBe(charge);
  });
});

describe("les permissions répétées (Q2.8.6.a)", () => {
  it.each([
    [1, 10],
    [2, 6],
    [4, 4],
    [5, 2],
  ])(
    "toutes les %i semaine(s) : %i trajets par mois au plus",
    (semaines, trajets) => {
      expect(
        permission({ "Q2.8.6.a": semaines }).trajetsMensuelsMaximum(),
      ).toBe(trajets);
    },
  );

  it("sans fréquence lisible, aucun maximum", () => {
    expect(permission({}).trajetsMensuelsMaximum()).toBeUndefined();
    expect(
      permission({ "Q2.8.6.a": 0 }).trajetsMensuelsMaximum(),
    ).toBeUndefined();
  });
});
