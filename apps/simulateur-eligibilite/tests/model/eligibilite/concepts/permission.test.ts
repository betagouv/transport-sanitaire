// La permission, lue sur des réponses données : la tranche d'âge de Q2.7 et la
// répétition de Q2.8.5 (D-107). Lue sur des réponses validées : le transfert
// qu'elle écarte. Les contrôles de dates de Q2.8 se testent sur leur page
// (`dates-de-la-permission.test.ts`).

import { describe, expect, it } from "vitest";
import { Permission } from "../../../../core/models/eligibilite/concepts/permission";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import { GivenAnswers } from "../../../../core/socle/questionnaire-engine/given-answers";
import type {
  Answers,
  Validated,
} from "../../../../core/socle/questionnaire-engine/question";
import { ValidatedAnswers } from "../../../../core/socle/questionnaire-engine/validated-answers";

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

describe("le transfert que la permission écarte", () => {
  const ecarteLeTransfert = (entrees: Validated<Questions>) => {
    const fait = Permission.of(
      new ValidatedAnswers<Questions>(entrees),
    ).ecarteLeTransfert();
    return fait && [fait.value, fait.provenance];
  };

  it.each([
    [
      { "Q2.1": { answer: "11_PERMISSION" } },
      [
        false,
        "Q2.1 : « 11_PERMISSION » ; une permission n'est ni un transfert ni un déplacement pour soins (option 9 écartée).",
      ],
    ],
    [
      { "Q2.2.1.a": { answer: "1_OUI" } },
      [
        false,
        "Q2.2.1.a : « 1_OUI » ; une permission n'est ni un transfert ni un déplacement pour soins (option 2 écartée).",
      ],
    ],
    [{ "Q2.2.1.a": { answer: "2_NON" } }, undefined],
    [{}, undefined],
  ] as const)("%j : %j", (entrees, attendu) => {
    expect(ecarteLeTransfert(entrees as Validated<Questions>)).toEqual(attendu);
  });

  it("Q2.5 validée décide : la permission laisse la main", () => {
    expect(
      ecarteLeTransfert({
        "Q2.1": { answer: "11_PERMISSION" },
        "Q2.5": { answer: "1_TRANSFERT" },
      }),
    ).toBeUndefined();
  });
});
