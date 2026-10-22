// La permission, lue sur des réponses données : les contrôles de dates de
// Q2.8, avec les formats `AAAA-MM-JJ` et `AAAA-MM-JJTHH:mm` et leurs cas
// limites (D-107), la tranche d'âge de Q2.7 et la répétition de Q2.8.5.

import { describe, expect, it } from "vitest";
import { Permission } from "../../../../core/models/eligibilite/concepts/permission";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import { GivenAnswers } from "../../../../core/socle/questionnaire-engine/given-answers";
import type { Answers } from "../../../../core/socle/questionnaire-engine/question";

const permission = (reponses: Answers<Questions>) =>
  Permission.of(new GivenAnswers<Questions>(reponses));

describe("commence avant l'hospitalisation", () => {
  it.each([
    ["2026-10-01", "2026-09-30T23:59", true],
    ["2026-10-01", "2026-10-01T00:00", false],
    ["2026-10-01", "2026-10-01T08:00", false],
  ])(
    "hospitalisé le %s, début le %s : %s",
    (hospitalisation, debut, attendu) => {
      expect(
        permission({
          "Q2.8.1": hospitalisation,
          "Q2.8.2": debut,
        }).commenceAvantLHospitalisation(),
      ).toBe(attendu);
    },
  );
});

describe("commence avant le 14e jour", () => {
  it.each([
    ["2026-10-01", "2026-10-13T23:59", true],
    ["2026-10-01", "2026-10-14T00:00", false],
    ["2026-10-01", "2026-10-20T10:00", false],
    // Le mois et l'année se retournent, février 2028 compte 29 jours.
    ["2026-12-25", "2027-01-06T23:59", true],
    ["2026-12-25", "2027-01-07T00:00", false],
    ["2028-02-20", "2028-03-04T00:00", false],
    ["2028-02-20", "2028-03-03T23:59", true],
  ])(
    "hospitalisé le %s, début le %s : %s",
    (hospitalisation, debut, attendu) => {
      expect(
        permission({
          "Q2.8.1": hospitalisation,
          "Q2.8.2": debut,
        }).commenceAvantLeQuatorziemeJour(),
      ).toBe(attendu);
    },
  );
});

describe("ne finit pas après son début", () => {
  it.each([
    ["2026-10-14T09:00", "2026-10-14T08:59", true],
    ["2026-10-14T09:00", "2026-10-14T09:00", true],
    ["2026-10-14T09:00", "2026-10-14T09:01", false],
  ])("début %s, fin %s : %s", (debut, fin, attendu) => {
    expect(
      permission({
        "Q2.8.2": debut,
        "Q2.8.3": fin,
      }).neFinitPasApresSonDebut(),
    ).toBe(attendu);
  });
});

describe("dépasse 48 heures", () => {
  it.each([
    ["2026-10-14T09:00", "2026-10-16T09:00", false],
    ["2026-10-14T09:00", "2026-10-16T09:01", true],
    // Le changement d'heure du 25 octobre 2026 ne décale rien.
    ["2026-10-24T09:00", "2026-10-26T09:00", false],
    ["2026-10-24T09:00", "2026-10-26T09:01", true],
  ])("début %s, fin %s : %s", (debut, fin, attendu) => {
    expect(
      permission({
        "Q2.8.2": debut,
        "Q2.8.3": fin,
      }).depasseQuaranteHuitHeures(),
    ).toBe(attendu);
  });
});

describe("la période finit avant la première permission", () => {
  it.each([
    ["2026-10-14", "2026-10-15T09:00", true],
    ["2026-10-15", "2026-10-15T09:00", false],
    ["2026-10-15", "2026-10-15T23:59", false],
    ["2026-11-01", "2026-10-15T09:00", false],
  ])(
    "période jusqu'au %s, permission jusqu'au %s : %s",
    (periode, fin, attendu) => {
      expect(
        permission({
          "Q2.8.6": periode,
          "Q2.8.3": fin,
        }).periodeFinitAvantLaPremiere(),
      ).toBe(attendu);
    },
  );
});

describe("une saisie incomplète ou mal écrite", () => {
  it.each([undefined, "", "2026-10", "14/10/2026", "2026-10-14T9h"])(
    "%j n'est comparée à rien",
    (saisie) => {
      const valide = "2026-10-01T00:00";
      expect(
        permission({
          "Q2.8.1": saisie,
          "Q2.8.2": valide,
        }).commenceAvantLHospitalisation(),
      ).toBe(false);
      expect(
        permission({
          "Q2.8.1": "2026-10-01",
          "Q2.8.2": saisie,
        }).commenceAvantLeQuatorziemeJour(),
      ).toBe(false);
      expect(
        permission({
          "Q2.8.2": saisie,
          "Q2.8.3": valide,
        }).neFinitPasApresSonDebut(),
      ).toBe(false);
      expect(
        permission({
          "Q2.8.2": valide,
          "Q2.8.3": saisie,
        }).depasseQuaranteHuitHeures(),
      ).toBe(false);
      expect(
        permission({
          "Q2.8.6": saisie,
          "Q2.8.3": valide,
        }).periodeFinitAvantLaPremiere(),
      ).toBe(false);
    },
  );
});

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

describe("la répétition de Q2.8.5", () => {
  it("se répète, une seule fois, ou n'est pas encore dite", () => {
    expect(permission({ "Q2.8.5": "1_OUI" }).estRepetee()).toBe(true);
    expect(permission({ "Q2.8.5": "2_NON" }).estUnique()).toBe(true);
    const sansReponse = permission({});
    expect([sansReponse.estRepetee(), sansReponse.estUnique()]).toEqual([
      false,
      false,
    ]);
  });

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
