// Les contrôles de la page de la permission du mineur (Q2.8) : un message par
// incohérence, sur la plus tardive des deux questions, et le blocage de
// Q2.8.6.b. `CATALOGUE_COMPLET_QUESTIONS.md` Q2.8 du paquet de l'éditeur (D-107).
//
// Le jour 1 est la date d'hospitalisation, le 1er octobre : le 14e jour est le
// 14 octobre. Les dates de la permission sont des dates seules, sa durée se
// déclare (DATES-SEULES-20261104).

import { describe, expect, it } from "vitest";
import {
  incoherences,
  MINEUR,
  PLUSIEURS_PERMISSIONS,
  posee,
  type Reponses,
  validee,
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

const debut = (valeur: string): Reponses => ({ ...MINEUR, "Q2.8.2": valeur });
const permission = (de: string, a: string): Reponses => ({
  ...MINEUR,
  "Q2.8.2": de,
  "Q2.8.3": a,
});
const periode = (fin: string): Reponses => ({
  ...PLUSIEURS_PERMISSIONS,
  "Q2.8.6": fin,
});

describe("le début de la première permission (Q2.8.2)", () => {
  it("avant l'hospitalisation, bloque deux fois : le début et le 14e jour", () => {
    const reponses = debut("2026-09-30");
    expect(incoherences("Q2.8.2", reponses)).toEqual([
      AVANT_L_HOSPITALISATION,
      AVANT_LE_QUATORZIEME,
    ]);
    expect(validee("Q2.8.2", reponses)).toBe(false);
  });

  it("le jour de l'hospitalisation, bloque encore le 14e jour", () => {
    expect(incoherences("Q2.8.2", debut("2026-10-01"))).toEqual([
      AVANT_LE_QUATORZIEME,
    ]);
  });

  it("la veille du 14e jour bloque", () => {
    const reponses = debut("2026-10-13");
    expect(incoherences("Q2.8.2", reponses)).toEqual([AVANT_LE_QUATORZIEME]);
    expect(validee("Q2.8.4", reponses)).toBe(false);
  });

  it("le 14e jour est accepté", () => {
    const reponses = debut("2026-10-14");
    expect(incoherences("Q2.8.2", reponses)).toEqual([]);
    expect(validee("Q2.8.2", reponses)).toBe(true);
  });

  it("ne dit rien tant que la date d'hospitalisation manque", () => {
    const { "Q2.8.1": _, ...sansDate } = MINEUR;
    expect(incoherences("Q2.8.2", sansDate)).toEqual([]);
  });
});

describe("la fin de la première permission (Q2.8.3)", () => {
  it("avant son début, bloque", () => {
    const reponses = permission("2026-10-14", "2026-10-13");
    expect(incoherences("Q2.8.3", reponses)).toEqual([FIN_AVANT_LE_DEBUT]);
    expect(validee("Q2.8.3", reponses)).toBe(false);
  });

  it("le jour même de son début est acceptée", () => {
    const reponses = permission("2026-10-14", "2026-10-14");
    expect(incoherences("Q2.8.3", reponses)).toEqual([]);
    expect(validee("Q2.8.3", reponses)).toBe(true);
  });
});

describe("la durée de la permission (Q2.8.duree_48h)", () => {
  const duree = (valeur: "1_OUI" | "2_NON", a = "2026-10-15"): Reponses => ({
    ...permission("2026-10-14", a),
    "Q2.8.duree_48h": valeur,
  });

  it("se pose après la date de fin, sur la même page, en Oui et Non", () => {
    const question = posee("P2/permission-mineur", "Q2.8.duree_48h", MINEUR);
    expect(question?.label).toBe(
      "Cette permission dure-t-elle au maximum 48 heures ?",
    );
    expect(
      question?.kind === "single choice" &&
        question.options.map(({ label }) => label),
    ).toEqual(["Oui.", "Non."]);
  });

  it("attend sa réponse pour valider la page", () => {
    const { "Q2.8.duree_48h": _, ...sansDuree } = MINEUR;
    expect(validee("Q2.8.4", sansDuree)).toBe(false);
  });

  it("Non est accepté quand les dates le permettent, sans bloquer la page", () => {
    const reponses = duree("2_NON", "2026-10-16");
    expect(incoherences("Q2.8.duree_48h", reponses)).toEqual([]);
    expect(validee("Q2.8.duree_48h", reponses)).toBe(true);
  });

  it("une réponse que les dates contredisent bloque", () => {
    const reponses = duree("2_NON");
    expect(incoherences("Q2.8.duree_48h", reponses)).toEqual([
      DUREE_CONTREDITE,
    ]);
    expect(validee("Q2.8.duree_48h", reponses)).toBe(false);
  });
});

describe("la fin de la période (Q2.8.6)", () => {
  it("avant la fin de la première permission, bloque", () => {
    const reponses = periode("2026-10-14");
    expect(incoherences("Q2.8.6", reponses)).toEqual([PERIODE_TROP_COURTE]);
    expect(validee("Q2.8.6", reponses)).toBe(false);
  });

  it("le jour de la fin de la première permission est accepté", () => {
    expect(incoherences("Q2.8.6", periode("2026-10-15"))).toEqual([]);
  });

  it("ne bloque pas une période sans date", () => {
    const { "Q2.8.6": _, ...sansFin } = PLUSIEURS_PERMISSIONS;
    expect(incoherences("Q2.8.6", sansFin)).toEqual([]);
  });
});

describe("la période et sa fréquence (Q2.8.5 = Oui)", () => {
  it("révèle les trois champs de la période, et eux seuls", () => {
    const champs = ["Q2.8.6", "Q2.8.6.a", "Q2.8.6.b"] as const;
    for (const id of champs) {
      expect(posee("P2/permission-mineur", id, MINEUR)).toBeUndefined();
      expect(
        posee("P2/permission-mineur", id, PLUSIEURS_PERMISSIONS),
      ).toBeDefined();
    }
  });

  it("demande un entier d'au moins une semaine", () => {
    const frequence = posee(
      "P2/permission-mineur",
      "Q2.8.6.a",
      PLUSIEURS_PERMISSIONS,
    );
    expect(frequence).toMatchObject({
      kind: "number",
      integer: true,
      min: 1,
      unit: "semaine(s)",
    });
    expect(frequence?.isAnsweredBy(1)).toBe(true);
    expect(frequence?.isAnsweredBy(0)).toBe(false);
    expect(frequence?.isAnsweredBy(1.5)).toBe(false);
  });

  it("Q2.8.6.b « Oui » valide la page", () => {
    expect(validee("Q2.8.6.b", PLUSIEURS_PERMISSIONS)).toBe(true);
  });

  it("Q2.8.6.b « Non » bloque Suivant, et dit de raccourcir la période", () => {
    const reponses: Reponses = {
      ...PLUSIEURS_PERMISSIONS,
      "Q2.8.6.b": "2_NON",
    };
    const question = posee("P2/permission-mineur", "Q2.8.6.b", reponses);
    expect(question?.kind).toBe("single choice");
    expect(
      question?.kind === "single choice" &&
        question.options.find(({ value }) => value === "2_NON")?.blocks,
    ).toBe(
      "La période doit se terminer avant le vingtième anniversaire du patient. Raccourcissez-la, puis faites une autre simulation pour la période suivante.",
    );
    expect(question?.isAnsweredBy("2_NON")).toBe(false);
    expect(validee("Q2.8.6.b", reponses)).toBe(false);
  });
});
