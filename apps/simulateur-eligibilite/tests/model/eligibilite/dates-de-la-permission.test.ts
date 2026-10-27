// Les cas limites des contrôles de dates de Q2.8, sur la page du mineur : les
// formats `AAAA-MM-JJ` et `AAAA-MM-JJTHH:mm`, les mois et années qui se
// retournent, le changement d'heure, et les saisies illisibles (D-107). Les
// messages et le blocage se testent dans `blocages-de-la-permission.test.ts`.

import { describe, expect, it } from "vitest";
import {
  incoherences,
  MINEUR,
  PLUSIEURS_PERMISSIONS,
  type Reponses,
} from "./reponses-de-la-permission";

const AVANT_L_HOSPITALISATION =
  "La permission ne peut pas commencer avant le début de l’hospitalisation.";
const AVANT_LE_QUATORZIEME =
  "La première permission doit commencer au 14e jour d’hospitalisation ou après.";
const FIN_AVANT_LE_DEBUT =
  "La fin de la permission doit venir après son début.";
const PLUS_DE_48_HEURES = "Une permission dure au plus 48 heures.";
const PERIODE_TROP_COURTE =
  "La période ne peut pas se terminer avant la fin de la première permission.";

// Le contrôle signale-t-il cette question, sur ces réponses ?
const signale = (
  message: string,
  id: keyof Reponses,
  reponses: Reponses,
): boolean => incoherences(id, reponses).includes(message);

const debut = (
  hospitalisation: string | undefined,
  debut: string | undefined,
) => ({ ...MINEUR, "Q2.8.1": hospitalisation, "Q2.8.2": debut }) as Reponses;
const permission = (de: string | undefined, a: string | undefined) =>
  ({ ...MINEUR, "Q2.8.2": de, "Q2.8.3": a }) as Reponses;
const periode = (jusquAu: string | undefined, fin: string | undefined) =>
  ({ ...PLUSIEURS_PERMISSIONS, "Q2.8.6": jusquAu, "Q2.8.3": fin }) as Reponses;

describe("commence avant l'hospitalisation", () => {
  it.each([
    ["2026-10-01", "2026-09-30T23:59", true],
    ["2026-10-01", "2026-10-01T00:00", false],
    ["2026-10-01", "2026-10-01T08:00", false],
  ])("hospitalisé le %s, début le %s : %s", (le, de, attendu) => {
    expect(signale(AVANT_L_HOSPITALISATION, "Q2.8.2", debut(le, de))).toBe(
      attendu,
    );
  });
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
  ])("hospitalisé le %s, début le %s : %s", (le, de, attendu) => {
    expect(signale(AVANT_LE_QUATORZIEME, "Q2.8.2", debut(le, de))).toBe(
      attendu,
    );
  });
});

describe("ne finit pas après son début", () => {
  it.each([
    ["2026-10-14T09:00", "2026-10-14T08:59", true],
    ["2026-10-14T09:00", "2026-10-14T09:00", true],
    ["2026-10-14T09:00", "2026-10-14T09:01", false],
  ])("début %s, fin %s : %s", (de, a, attendu) => {
    expect(signale(FIN_AVANT_LE_DEBUT, "Q2.8.3", permission(de, a))).toBe(
      attendu,
    );
  });
});

describe("dépasse 48 heures", () => {
  it.each([
    ["2026-10-14T09:00", "2026-10-16T09:00", false],
    ["2026-10-14T09:00", "2026-10-16T09:01", true],
    // Le changement d'heure du 25 octobre 2026 ne décale rien.
    ["2026-10-24T09:00", "2026-10-26T09:00", false],
    ["2026-10-24T09:00", "2026-10-26T09:01", true],
  ])("début %s, fin %s : %s", (de, a, attendu) => {
    expect(signale(PLUS_DE_48_HEURES, "Q2.8.3", permission(de, a))).toBe(
      attendu,
    );
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
    (jusquAu, fin, attendu) => {
      expect(
        signale(PERIODE_TROP_COURTE, "Q2.8.6", periode(jusquAu, fin)),
      ).toBe(attendu);
    },
  );
});

describe("une saisie incomplète ou mal écrite", () => {
  const valide = "2026-10-01T00:00";

  it.each([undefined, "", "2026-10", "14/10/2026", "2026-10-14T9h"])(
    "%j n'est comparée à rien",
    (saisie) => {
      expect(incoherences("Q2.8.2", debut(saisie, valide))).toEqual([]);
      expect(
        signale(AVANT_LE_QUATORZIEME, "Q2.8.2", debut("2026-10-01", saisie)),
      ).toBe(false);
      expect(
        signale(FIN_AVANT_LE_DEBUT, "Q2.8.3", permission(saisie, valide)),
      ).toBe(false);
      expect(
        signale(PLUS_DE_48_HEURES, "Q2.8.3", permission(valide, saisie)),
      ).toBe(false);
      expect(
        signale(PERIODE_TROP_COURTE, "Q2.8.6", periode(saisie, valide)),
      ).toBe(false);
    },
  );
});
