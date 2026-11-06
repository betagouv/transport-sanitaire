// Un conflit de lieux certain s'arrête en P2 (#353,
// NAV-LIEUX-CONFLIT-CERTAIN-20261106) : l'alerte va à la réponse qui le crée,
// et Suivant reste bloqué. Un conflit qu'un sens lèverait attend P3.

import { describe, expect, it } from "vitest";
import { LIEUX_INCOMPATIBLES } from "../../../../core/models/eligibilite/questions/p2/conditions/conflit-de-lieux";
import type { Questions } from "../../../../core/models/eligibilite/questions/reponses";
import { Simulation } from "../../../../core/socle/simulation";
import { model } from "../../../../front/models/eligibilite";
import { posee, type Reponses } from "./reponses-du-transfert";

const SEUL: Reponses = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "1_SEUL",
  "Q1.3": ["7_AUCUNE"],
  "Q1.4": "1_VEHICULE_PERSONNEL",
};
// Une dialyse qui n'est pas une hémodialyse : Q2.1 se pose.
const DIALYSE: Reponses = {
  ...SEUL,
  "Q1.3": ["5_DIALYSE"],
  "Q1.3.a": "2_AUTRE_DIALYSE",
};
const HOSPITALISATION = (sousType: Reponses["Q2.1.g"]): Reponses => ({
  "Q2.1": "8_HOSPITALISATION",
  "Q2.1.g": sousType,
});
const SEJOUR: Reponses = {
  "Q2.2.1": ["1_HOSPITALISATION"],
  "Q2.2.1.cadre": "1_ETABLISSEMENT",
};

type Cas = readonly [string, string, keyof Questions, Reponses];

const alertes = (page: string, id: keyof Questions, reponses: Reponses) =>
  posee(page, id, reponses)?.inconsistencies ?? [];

describe("un conflit de lieux certain", () => {
  it.each<Cas>([
    [
      "dialyse et permission de Q2.1",
      "P2/prestation",
      "Q2.1",
      { ...DIALYSE, "Q2.1": "11_PERMISSION" },
    ],
    [
      "dialyse et permission de Q2.2.1.a",
      "P2/contextes",
      "Q2.2.1.a",
      { ...DIALYSE, "Q2.1": "1_CONSULTATION", ...SEJOUR, "Q2.2.1.a": "1_OUI" },
    ],
    [
      "dialyse et hébergement",
      "P2/contextes",
      "Q2.2.1",
      { ...DIALYSE, "Q2.1": "1_CONSULTATION", "Q2.2.1": ["5_HTNM"] },
    ],
    [
      "entrée et retour pénitentiaire",
      "P2/contextes",
      "Q2.2.1",
      {
        ...SEUL,
        ...HOSPITALISATION("1_ENTREE"),
        "Q2.2.1": ["10_RETOUR_PENITENTIAIRE"],
      },
    ],
    [
      "admission en HAD et retour pénitentiaire",
      "P2/contextes",
      "Q2.2.1",
      {
        ...SEUL,
        ...HOSPITALISATION("3_ADMISSION_HAD"),
        "Q2.2.1": ["10_RETOUR_PENITENTIAIRE"],
      },
    ],
    [
      "admission en HAD, hébergement et séjour",
      "P2/contextes",
      "Q2.2.1.cadre",
      {
        ...SEUL,
        ...HOSPITALISATION("3_ADMISSION_HAD"),
        ...SEJOUR,
        "Q2.2.1": ["1_HOSPITALISATION", "5_HTNM"],
      },
    ],
  ])("%s : l'alerte va à %s, %s", (_, page, id, reponses) => {
    expect(alertes(page, id, reponses)).toEqual([LIEUX_INCOMPATIBLES]);
  });

  it("ne va qu'à la réponse qui le crée", () => {
    const reponses: Reponses = {
      ...DIALYSE,
      "Q2.1": "1_CONSULTATION",
      ...SEJOUR,
      "Q2.2.1.a": "1_OUI",
    };
    expect(alertes("P2/contextes", "Q2.2.1", reponses)).toEqual([]);
    expect(alertes("P2/contextes", "Q2.2.1.cadre", reponses)).toEqual([]);
  });

  it("bloque Suivant : R2 reste hors d'atteinte", () => {
    const simulation = Simulation.resume(model.core, {
      ...DIALYSE,
      "Q2.1": "11_PERMISSION",
    });
    expect(simulation.stage.name).toBe("questionnaire");
    expect(simulation.page.id).toBe("P2/prestation");
  });
});

// Les liens de l'alerte (NAV-LIEUX-CORRECTION-001) : les réponses d'avant sans
// lesquelles le conflit ne serait plus certain, un lien par libellé.
describe("les réponses à revoir d'un conflit certain", () => {
  const SITUATION = {
    label: "Revoir la situation particulière",
    question: "Q1.3",
  };
  const SOUS_TYPE = {
    label: "Revoir la nature du déplacement",
    question: "Q2.1.g",
  };
  const revoir = (page: string, id: keyof Questions, reponses: Reponses) =>
    posee(page, id, reponses)?.revisits;

  it("la dialyse se revoit à la situation particulière, Q1.3", () => {
    const reponses = { ...DIALYSE, "Q2.1": "11_PERMISSION" } as const;
    expect(revoir("P2/prestation", "Q2.1", reponses)).toEqual([SITUATION]);
  });

  it("une entrée se revoit à la nature du déplacement, Q2.1.g", () => {
    const reponses: Reponses = {
      ...SEUL,
      ...HOSPITALISATION("1_ENTREE"),
      "Q2.2.1": ["10_RETOUR_PENITENTIAIRE"],
    };
    expect(revoir("P2/contextes", "Q2.2.1", reponses)).toEqual([SOUS_TYPE]);
  });

  it("deux réponses du déplacement : un lien, vers la première", () => {
    const reponses: Reponses = {
      ...SEUL,
      ...HOSPITALISATION("3_ADMISSION_HAD"),
      ...SEJOUR,
      "Q2.2.1": ["1_HOSPITALISATION", "5_HTNM"],
    };
    expect(revoir("P2/contextes", "Q2.2.1.cadre", reponses)).toEqual([
      SOUS_TYPE,
    ]);
  });
});

describe("un conflit qu'un sens lèverait", () => {
  it.each<Cas>([
    // Le retour part du centre de dialyse vers le domicile de l'HAD.
    [
      "dialyse et admission en HAD",
      "P2/prestation",
      "Q2.1.g",
      { ...DIALYSE, ...HOSPITALISATION("3_ADMISSION_HAD") },
    ],
    [
      "dialyse et retour pénitentiaire",
      "P2/contextes",
      "Q2.2.1",
      {
        ...DIALYSE,
        "Q2.1": "1_CONSULTATION",
        "Q2.2.1": ["10_RETOUR_PENITENTIAIRE"],
      },
    ],
    [
      "hébergement et retour pénitentiaire",
      "P2/contextes",
      "Q2.2.1",
      {
        ...SEUL,
        "Q2.1": "1_CONSULTATION",
        "Q2.2.1": ["5_HTNM", "10_RETOUR_PENITENTIAIRE"],
      },
    ],
    [
      "dialyse et soins en HAD",
      "P2/contextes",
      "Q2.2.1.cadre",
      {
        ...DIALYSE,
        "Q2.1": "1_CONSULTATION",
        "Q2.2.1": ["1_HOSPITALISATION"],
        "Q2.2.1.cadre": "2_HAD",
      },
    ],
    // Q3.1.2 ne propose que l'aller à une entrée (D-132) : P3 le dit.
    [
      "entrée et hébergement",
      "P2/contextes",
      "Q2.2.1",
      { ...SEUL, ...HOSPITALISATION("1_ENTREE"), "Q2.2.1": ["5_HTNM"] },
    ],
  ])("%s : pas d'alerte à %s, %s", (_, page, id, reponses) => {
    expect(posee(page, id, reponses)).toBeDefined();
    expect(alertes(page, id, reponses)).toEqual([]);
  });
});
