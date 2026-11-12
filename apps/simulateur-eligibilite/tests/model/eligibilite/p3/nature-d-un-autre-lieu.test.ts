// La nature d'un autre lieu de P3 (Q3.2, Q3.3, #400) : choisie sur une DAP,
// saisie sinon, jamais redemandée quand P2 la prouve ; et la catégorie où
// chaque nature se reporte. DOC-LIEUX-TROIS-CATEGORIES-20261105,
// `CONTRAT_LIEUX_CERFA.json`.

import { describe, expect, it } from "vitest";
import { model } from "../../../../core/models/eligibilite";
import { categorieDe } from "../../../../core/models/eligibilite/questions/p3/conditions/categories-du-lieu";
import { Questionnaire } from "../../../../core/socle/questionnaire-engine";
import { ciblesValant } from "../r2/traces-du-prescripteur";
import {
  ADRESSE,
  ALLER,
  ids,
  posee,
  posees,
  type Reponses,
} from "./questions-des-lieux";

const DAP = ciblesValant({ cible_support_id: "S3139h" });
const PMT = ciblesValant({ cible_support_id: "S3138g" });

describe("la nature d'un autre lieu (DOC-LIEUX-TROIS-CATEGORIES-20261105)", () => {
  const autreLieu: Reponses = { ...ALLER, "Q3.2.categorie": "3_AUTRE_LIEU" };

  it("un autre lieu choisi en P3 demande sa nature, avant le nom", () => {
    expect(ids("P3/depart", autreLieu)).toEqual([
      "Q3.2.categorie",
      "Q3.2.precision",
      "Q3.2.nom",
      "Q3.2.adresse",
    ]);
    expect(posee("P3/depart", "Q3.2.precision", autreLieu)).toMatchObject({
      label: "Nature du lieu",
      hint: "Par exemple : hôtel, hébergement chez un proche ou autre lieu.",
    });
  });

  it("l'autre lieu que Q2.13 nomme la demande, car Q2.13 ne la dit pas", () => {
    const entree: Reponses = {
      ...ALLER,
      "Q2.1.g": "1_ENTREE",
      "Q2.13.depart": "7_AUTRE_LIEU",
    };
    expect(ids("P3/depart", entree)).toEqual([
      "Q3.2.precision",
      "Q3.2.nom",
      "Q3.2.adresse",
    ]);
  });

  it("le HTNM que P2 établit ne la redemande pas", () => {
    const htnm: Reponses = { ...ALLER, "Q2.2.1": ["5_HTNM"] };
    expect(ids("P3/arrivee", htnm)).toEqual(["Q3.3.nom", "Q3.3.adresse"]);
  });

  it("sans elle, un autre lieu ne se valide pas", () => {
    const sansNature: Reponses = { ...autreLieu, "Q3.2.adresse": ADRESSE };
    const depart = model.complement.pages.filter(
      ({ id }) => id === "P3/depart",
    );
    const avecLaNature = { ...sansNature, "Q3.2.precision": "Foyer" };
    expect(
      new Questionnaire(depart).readWith(sansNature, PMT).isComplete(),
    ).toBe(false);
    expect(
      new Questionnaire(depart).readWith(avecLaNature, PMT).isComplete(),
    ).toBe(true);
  });

  it("sur une DAP, elle se choisit entre le HTNM et une autre à préciser", () => {
    const sur = (reponses: Reponses) =>
      posees("P3/depart", reponses, DAP).map(({ id }) => id);
    expect(sur(autreLieu)).toEqual([
      "Q3.2.categorie",
      "Q3.2.nature",
      "Q3.2.nom",
      "Q3.2.adresse",
    ]);
    const autre = { ...autreLieu, "Q3.2.nature": "2_AUTRE" } as Reponses;
    expect(sur(autre)).toContain("Q3.2.precision");
    const precision = posees("P3/depart", autre, DAP).find(
      ({ id }) => id === "Q3.2.precision",
    );
    expect(precision?.label).toBe("Précisez la nature du lieu");
  });

  it("le HTNM choisi sur une DAP rend son nom obligatoire", () => {
    const htnm = { ...autreLieu, "Q3.2.nature": "1_HTNM" } as Reponses;
    const nom = posees("P3/depart", htnm, DAP).find(
      ({ id }) => id === "Q3.2.nom",
    );
    expect(nom?.optional).toBe(false);
    expect(posees("P3/depart", htnm, DAP).map(({ id }) => id)).not.toContain(
      "Q3.2.precision",
    );
  });
});

describe("la catégorie de chaque nature (CONTRAT_LIEUX_CERFA)", () => {
  it.each([
    ["1_DOMICILE", "1_DOMICILE"],
    ["2_ETABLISSEMENT_DE_SANTE", "2_STRUCTURE_DE_SOINS"],
    ["3_EHPAD", "3_AUTRE_LIEU"],
    ["4_USLD", "2_STRUCTURE_DE_SOINS"],
    ["5_HEBERGEMENT_NON_MEDICALISE", "3_AUTRE_LIEU"],
    ["6_ETABLISSEMENT_PENITENTIAIRE", "3_AUTRE_LIEU"],
    ["7_CABINET", "2_STRUCTURE_DE_SOINS"],
    ["8_AUTRE_LIEU", "3_AUTRE_LIEU"],
  ] as const)("%s se reporte en %s", (nature, categorie) => {
    expect(categorieDe(nature)).toBe(categorie);
  });
});
