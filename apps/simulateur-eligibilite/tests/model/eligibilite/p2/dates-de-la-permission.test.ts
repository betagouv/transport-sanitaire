// Les cas limites des contrôles de dates de Q2.8, sur la page du mineur : des
// dates seules (DATES-SEULES-20261104), les mois et années qui se retournent,
// le changement d'heure, et les saisies illisibles (D-107). Les messages et le
// blocage se testent dans `blocages-de-la-permission.test.ts`.

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
  "La fin de la permission ne peut pas précéder son début.";
const DUREE_CONTREDITE =
  "Cette durée ne correspond pas aux dates de la permission.";
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
// Une durée déclarée, hospitalisé assez tôt pour qu'aucune autre date ne
// bloque.
const declaree = (de: string, a: string, duree: "1_OUI" | "2_NON") =>
  ({
    ...permission(de, a),
    "Q2.8.1": "2026-01-01",
    "Q2.8.duree_48h": duree,
  }) as Reponses;
const periode = (jusquAu: string | undefined, fin: string | undefined) =>
  ({ ...PLUSIEURS_PERMISSIONS, "Q2.8.6": jusquAu, "Q2.8.3": fin }) as Reponses;

describe("commence avant l'hospitalisation", () => {
  it.each([
    ["2026-10-01", "2026-09-30", true],
    ["2026-10-01", "2026-10-01", false],
  ])("hospitalisé le %s, début le %s : %s", (le, de, attendu) => {
    expect(signale(AVANT_L_HOSPITALISATION, "Q2.8.2", debut(le, de))).toBe(
      attendu,
    );
  });
});

describe("commence avant le 14e jour", () => {
  it.each([
    ["2026-10-01", "2026-10-13", true],
    ["2026-10-01", "2026-10-14", false],
    // Le mois et l'année se retournent, février 2028 compte 29 jours.
    ["2026-12-25", "2027-01-06", true],
    ["2026-12-25", "2027-01-07", false],
    ["2028-02-20", "2028-03-03", true],
    ["2028-02-20", "2028-03-04", false],
  ])("hospitalisé le %s, début le %s : %s", (le, de, attendu) => {
    expect(signale(AVANT_LE_QUATORZIEME, "Q2.8.2", debut(le, de))).toBe(
      attendu,
    );
  });
});

describe("finit avant son début", () => {
  it.each([
    ["2026-10-14", "2026-10-13", true],
    // Une permission sur une seule date est possible.
    ["2026-10-14", "2026-10-14", false],
    ["2026-10-14", "2026-10-15", false],
  ])("début %s, fin %s : %s", (de, a, attendu) => {
    expect(signale(FIN_AVANT_LE_DEBUT, "Q2.8.3", permission(de, a))).toBe(
      attendu,
    );
  });
});

// Les dates seules ne refusent une durée que si elles la contredisent à coup
// sûr, en jours de Paris.
describe("la durée déclarée contredit les dates", () => {
  it.each([
    // Au plus 48 heures : refusé dès que trois nuits séparent les dates.
    ["2026-11-04", "2026-11-06", "1_OUI", false],
    ["2026-11-04", "2026-11-07", "1_OUI", true],
    // Plus de 48 heures : refusé sur une ou deux dates.
    ["2026-11-04", "2026-11-04", "2_NON", true],
    ["2026-11-04", "2026-11-05", "2_NON", true],
    ["2026-11-04", "2026-11-06", "2_NON", false],
    // Le 25 octobre 2026 compte 25 heures : du 24 au 25, la permission peut
    // durer 49 heures.
    ["2026-10-24", "2026-10-25", "2_NON", false],
    // Le 29 mars 2026 compte 23 heures : du 27 au 30, elle peut ne durer que
    // 47 heures.
    ["2026-03-27", "2026-03-30", "1_OUI", false],
  ] as const)("du %s au %s, %s : %s", (de, a, duree, attendu) => {
    expect(
      signale(DUREE_CONTREDITE, "Q2.8.duree_48h", declaree(de, a, duree)),
    ).toBe(attendu);
  });
});

describe("la période finit avant la première permission", () => {
  it.each([
    ["2026-10-14", "2026-10-15", true],
    ["2026-10-15", "2026-10-15", false],
    ["2026-11-01", "2026-10-15", false],
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
  const valide = "2026-10-01";

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
        signale(DUREE_CONTREDITE, "Q2.8.duree_48h", {
          ...permission(valide, saisie),
          "Q2.8.duree_48h": "2_NON",
        } as Reponses),
      ).toBe(false);
      expect(
        signale(PERIODE_TROP_COURTE, "Q2.8.6", periode(saisie, valide)),
      ).toBe(false);
    },
  );
});
