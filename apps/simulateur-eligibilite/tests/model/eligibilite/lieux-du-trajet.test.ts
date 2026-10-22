// Les pages du départ et de l'arrivée de P3 (Q3.2, Q3.3, #145) : ce que P2
// établit se rappelle sans se redemander, et les adresses se contrôlent sans
// toucher à R2. `CATALOGUE_COMPLET_QUESTIONS.md` Q2.13, Q3.2 et Q3.3.

import { describe, expect, it } from "vitest";
import { model } from "../../../core/models/eligibilite";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import { projectionCerfa } from "../../../core/models/eligibilite/p3/lieux-du-trajet";
import { SEEDS } from "../../../core/models/eligibilite/seeds-catalogue";
import { preconisationOf } from "../../../core/socle/model";
import {
  areAnswered,
  askedQuestions,
} from "../../../core/socle/questionnaire-engine/asked-questions";
import { GivenAnswers } from "../../../core/socle/questionnaire-engine/given-answers";
import type {
  Answers,
  AnyCibles,
  Question,
} from "../../../core/socle/questionnaire-engine/question";

type Reponses = Answers<Questions>;

const pages = model.complement.pages;
const PMT = { cible_support_id: "S3138g" } as AnyCibles;
const ALLER: Reponses = { "Q3.1.1": 1, "Q3.1.2": "1_ALLER" };
const DIALYSE: Reponses = { ...ALLER, "Q1.3": ["5_DIALYSE"] };
const ADRESSE = {
  street: "1 rue de la Paix",
  postalCode: "75002",
  city: "Paris",
};

const posees = (
  pageId: string,
  reponses: Reponses,
  cibles: AnyCibles = PMT,
) => {
  const page = pages.find(({ id }) => id === pageId);
  if (!page) throw new Error(`${pageId} n'existe pas`);
  return askedQuestions(pages, page, reponses, cibles);
};
const ids = (pageId: string, reponses: Reponses) =>
  posees(pageId, reponses).map(({ id }) => id);
const posee = (pageId: string, id: keyof Questions, reponses: Reponses) => {
  const trouvee = posees(pageId, reponses).find((q) => q.id === id);
  if (!trouvee) throw new Error(`${id} ne se pose pas`);
  return trouvee;
};
const natures = (question: Question) =>
  question.kind === "single choice"
    ? question.options.map(({ value }) => value)
    : [];

describe("ce que P2 établit d'un lieu (Q2.13, Q3.3)", () => {
  it("sans fait de P2, la nature se choisit d'abord, puis le nom et l'adresse", () => {
    expect(ids("P3/depart", ALLER)).toEqual(["Q3.2.nature", "Q3.2.adresse"]);
    expect(ids("P3/depart", { ...ALLER, "Q3.2.nature": "7_CABINET" })).toEqual([
      "Q3.2.nature",
      "Q3.2.nom",
      "Q3.2.adresse",
    ]);
  });

  it("l'aller d'une dialyse en centre arrive au centre, rappelé sans sélecteur", () => {
    expect(ids("P3/arrivee", DIALYSE)).toEqual(["Q3.3.nom", "Q3.3.adresse"]);
    expect(posee("P3/arrivee", "Q3.3.nom", DIALYSE).reminder).toEqual([
      { label: "Lieu d’arrivée", value: "Le centre de dialyse" },
    ]);
  });

  it("le retour d'une dialyse en centre part du centre", () => {
    const retour: Reponses = { ...DIALYSE, "Q3.1.2": "2_RETOUR" };
    expect(ids("P3/depart", retour)).toEqual(["Q3.2.nom", "Q3.2.adresse"]);
    expect(ids("P3/arrivee", retour)).toEqual(["Q3.3.nature", "Q3.3.adresse"]);
  });

  it("un aller-retour équivalent se décrit dans le sens de l'aller, une seule fois", () => {
    const equivalent: Reponses = {
      ...DIALYSE,
      "Q3.1.2": "3_ALLER_RETOUR_EQUIVALENT",
    };
    const lieux = pages.filter(({ questions }) =>
      questions.some(({ id }) => id.endsWith(".adresse")),
    );
    expect(lieux.map(({ id }) => id)).toEqual(["P3/depart", "P3/arrivee"]);
    expect(ids("P3/arrivee", equivalent)).toEqual(["Q3.3.nom", "Q3.3.adresse"]);
  });

  it("une entrée arrive à l'établissement, et part du lieu que Q2.13 nomme", () => {
    const entree: Reponses = {
      ...ALLER,
      "Q2.1.g": "1_ENTREE",
      "Q2.13.depart": "3_EHPAD",
    };
    expect(ids("P3/arrivee", entree)).toEqual(["Q3.3.nom", "Q3.3.adresse"]);
    expect(posee("P3/depart", "Q3.2.nom", entree).reminder).toEqual([
      {
        label: "Lieu de départ",
        value:
          "EHPAD (Établissement d'Hébergement pour Personnes Âgées Dépendantes)",
      },
    ]);
  });

  it("une sortie part de l'établissement", () => {
    const sortie: Reponses = { ...ALLER, "Q2.1.g": "2_SORTIE" };
    expect(ids("P3/depart", sortie)).toEqual(["Q3.2.nom", "Q3.2.adresse"]);
  });

  it("une admission en HAD arrive au domicile : ni nature, ni nom, et le départ n'en est pas un", () => {
    const had: Reponses = { ...ALLER, "Q2.1.g": "3_ADMISSION_HAD" };
    expect(ids("P3/arrivee", had)).toEqual(["Q3.3.adresse"]);
    expect(posee("P3/arrivee", "Q3.3.adresse", had).reminder).toEqual([
      {
        label: "Lieu d’arrivée",
        value:
          "Le domicile, pour l’admission en HAD (Hospitalisation à Domicile)",
      },
    ]);
    expect(natures(posee("P3/depart", "Q3.2.nature", had))).not.toContain(
      "1_DOMICILE",
    );
  });
});

describe("les contrôles des deux lieux", () => {
  const depuisLeDomicile: Reponses = {
    ...ALLER,
    "Q3.2.nature": "1_DOMICILE",
    "Q3.2.adresse": ADRESSE,
  };

  it("après un départ du domicile, l'arrivée ne propose plus le domicile", () => {
    const nature = posee("P3/arrivee", "Q3.3.nature", depuisLeDomicile);
    expect(natures(nature)).not.toContain("1_DOMICILE");
    expect(natures(nature)).toContain("2_ETABLISSEMENT_DE_SANTE");
  });

  it("un autre lieu sans nom se valide : le nom ne se donne que s'il est utile", () => {
    const sansNom: Reponses = {
      ...ALLER,
      "Q3.2.nature": "7_CABINET",
      "Q3.2.adresse": ADRESSE,
    };
    const depart = pages.filter(({ id }) => id === "P3/depart");
    expect(areAnswered(depart, new GivenAnswers(sansNom), PMT)).toBe(true);
  });

  it("deux adresses identiques bloquent l'arrivée, aux espaces extrêmes et à la casse près", () => {
    const meme: Reponses = {
      ...depuisLeDomicile,
      "Q3.3.nature": "7_CABINET",
      "Q3.3.adresse": { ...ADRESSE, city: " PARIS " },
    };
    expect(posee("P3/arrivee", "Q3.3.adresse", meme).inconsistencies).toEqual([
      "Le départ et l’arrivée ont la même adresse : ce trajet n’existe pas. Corrigez l’une des deux.",
    ]);
  });

  it("le départ à l'étranger selon Q2.2.5 demande le pays ; l'arrivée reste en France", () => {
    const etranger: Reponses = { ...ALLER, "Q2.2.5": ["1_DEPART"] };
    expect(posee("P3/depart", "Q3.2.adresse", etranger)).toMatchObject({
      abroad: true,
    });
    expect(posee("P3/arrivee", "Q3.3.adresse", etranger)).toMatchObject({
      abroad: false,
    });
  });

  it("le pays saisi en P3 ne change pas l'issue", () => {
    const seed = SEEDS.find(({ id }) => id === "issue-dap-etranger-a-examiner");
    if (!seed) throw new Error("seed absente");
    const avecLePays = {
      ...seed.answers,
      ...ALLER,
      "Q3.2.nature": "1_DOMICILE",
      "Q3.2.adresse": {
        street: "Rue Neuve 1",
        city: "Bruxelles",
        country: "Belgique",
      },
    } as Reponses;
    expect(preconisationOf(model, avecLePays).cibles).toEqual(
      preconisationOf(model, seed.answers).cibles,
    );
  });
});

describe("la nature en toutes lettres d'un hébergement ou d'un autre lieu (CONTRAT_LIEUX_CERFA)", () => {
  it("un autre lieu choisi en P3 demande sa nature, après le nom", () => {
    expect(
      ids("P3/depart", { ...ALLER, "Q3.2.nature": "8_AUTRE_LIEU" }),
    ).toEqual(["Q3.2.nature", "Q3.2.nom", "Q3.2.precision", "Q3.2.adresse"]);
  });

  it("un hébergement choisi en P3 la demande aussi", () => {
    expect(
      ids("P3/depart", {
        ...ALLER,
        "Q3.2.nature": "5_HEBERGEMENT_NON_MEDICALISE",
      }),
    ).toContain("Q3.2.precision");
  });

  it("l'autre lieu que Q2.13 nomme la demande, car Q2.13 ne la dit pas", () => {
    const entree: Reponses = {
      ...ALLER,
      "Q2.1.g": "1_ENTREE",
      "Q2.13.depart": "7_AUTRE_LIEU",
    };
    expect(ids("P3/depart", entree)).toEqual([
      "Q3.2.nom",
      "Q3.2.precision",
      "Q3.2.adresse",
    ]);
  });

  it("le HTNM que P2 établit ne la redemande pas", () => {
    const htnm: Reponses = { ...ALLER, "Q2.2.1.b": ["5_HTNM"] };
    expect(ids("P3/arrivee", htnm)).toEqual(["Q3.3.nom", "Q3.3.adresse"]);
  });

  it("sans elle, un autre lieu ne se valide pas", () => {
    const sansNature: Reponses = {
      ...ALLER,
      "Q3.2.nature": "8_AUTRE_LIEU",
      "Q3.2.adresse": ADRESSE,
    };
    const depart = pages.filter(({ id }) => id === "P3/depart");
    const avecLaNature = { ...sansNature, "Q3.2.precision": "Foyer" };
    expect(areAnswered(depart, new GivenAnswers(sansNature), PMT)).toBe(false);
    expect(areAnswered(depart, new GivenAnswers(avecLaNature), PMT)).toBe(true);
  });
});

describe("la case du cerfa de chaque nature (CONTRAT_LIEUX_CERFA)", () => {
  it.each([
    ["1_DOMICILE", "DOMICILE"],
    ["2_ETABLISSEMENT_DE_SANTE", "STRUCTURE_DE_SOINS"],
    ["3_EHPAD", "AUTRE_LIEU"],
    ["4_USLD", "STRUCTURE_DE_SOINS"],
    ["5_HEBERGEMENT_NON_MEDICALISE", "AUTRE_LIEU"],
    ["6_ETABLISSEMENT_PENITENTIAIRE", "AUTRE_LIEU"],
    ["7_CABINET", "STRUCTURE_DE_SOINS"],
    ["8_AUTRE_LIEU", "AUTRE_LIEU"],
  ] as const)("%s se reporte en %s", (nature, projection) => {
    expect(projectionCerfa(nature)).toBe(projection);
  });
});
