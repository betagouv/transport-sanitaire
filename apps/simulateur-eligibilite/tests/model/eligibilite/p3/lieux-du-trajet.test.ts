// Les pages du départ et de l'arrivée de P3 (Q3.2, Q3.3, #145, #400) : chaque
// lieu se range dans l'une des trois catégories, ce que P2 établit se rappelle
// sans se redemander, et les adresses se contrôlent sans toucher à R2.
// QST-LIEUX-TROIS-CATEGORIES-20261105, `CATALOGUE_COMPLET_QUESTIONS.md` Q2.13.

import { describe, expect, it } from "vitest";
import { model } from "../../../../core/models/eligibilite";
import type { Questions } from "../../../../core/models/eligibilite/questions/reponses";
import { SEEDS } from "../../../../core/models/eligibilite/seeds-catalogue";
import {
  type Answers,
  type AnyCibles,
  type AskedQuestion,
  answerOnPage,
  Questionnaire,
} from "../../../../core/socle/questionnaire-engine";

import { EstablishAPreconisation } from "../../../../core/socle/simulation";
import { ciblesValant } from "../r2/traces-du-prescripteur";

type Reponses = Answers<Questions>;

const pages = model.complement.pages;
const PMT = ciblesValant({ cible_support_id: "S3138g" });
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
  return new Questionnaire(pages).readWith(reponses, cibles).questionsOn(page);
};
const ids = (pageId: string, reponses: Reponses) =>
  posees(pageId, reponses).map(({ id }) => id);
const posee = (pageId: string, id: keyof Questions, reponses: Reponses) => {
  const trouvee = posees(pageId, reponses).find((q) => q.id === id);
  if (!trouvee) throw new Error(`${id} ne se pose pas`);
  return trouvee;
};
const options = (question: AskedQuestion) =>
  question.kind === "single choice"
    ? question.options.map(({ value }) => value)
    : [];

describe("ce que P2 établit d'un lieu (Q2.13, Q3.3)", () => {
  it("sans fait de P2, la catégorie se choisit d'abord, puis ses champs", () => {
    expect(ids("P3/depart", ALLER)).toEqual(["Q3.2.categorie", "Q3.2.adresse"]);
    expect(options(posee("P3/depart", "Q3.2.categorie", ALLER))).toEqual([
      "1_DOMICILE",
      "2_STRUCTURE_DE_SOINS",
      "3_AUTRE_LIEU",
    ]);
    expect(
      ids("P3/depart", { ...ALLER, "Q3.2.categorie": "2_STRUCTURE_DE_SOINS" }),
    ).toEqual(["Q3.2.categorie", "Q3.2.nom", "Q3.2.service", "Q3.2.adresse"]);
  });

  it("une structure de soins demande le nom de la structure ; un autre lieu, le nom du lieu", () => {
    const structure = { ...ALLER, "Q3.2.categorie": "2_STRUCTURE_DE_SOINS" };
    const autre = { ...ALLER, "Q3.2.categorie": "3_AUTRE_LIEU" };
    expect(posee("P3/depart", "Q3.2.nom", structure as Reponses)).toMatchObject(
      { label: "Nom de la structure", optional: false },
    );
    expect(posee("P3/depart", "Q3.2.nom", autre as Reponses)).toMatchObject({
      label: "Nom du lieu",
      optional: true,
    });
    expect(
      posee("P3/depart", "Q3.2.service", structure as Reponses),
    ).toMatchObject({ label: "Service concerné", optional: true });
  });

  it("l'aller d'une dialyse en centre part d'un lieu à choisir, et arrive au centre, rappelé sans sélecteur", () => {
    expect(ids("P3/depart", DIALYSE)).toEqual([
      "Q3.2.categorie",
      "Q3.2.adresse",
    ]);
    expect(ids("P3/arrivee", DIALYSE)).toEqual([
      "Q3.3.nom",
      "Q3.3.service",
      "Q3.3.adresse",
    ]);
    expect(posee("P3/arrivee", "Q3.3.nom", DIALYSE).reminder).toEqual([
      { label: "Lieu d’arrivée", value: "Le centre de dialyse" },
    ]);
  });

  it("le retour d'une dialyse en centre part du centre", () => {
    const retour: Reponses = { ...DIALYSE, "Q3.1.2": "2_RETOUR" };
    expect(ids("P3/depart", retour)).toEqual([
      "Q3.2.nom",
      "Q3.2.service",
      "Q3.2.adresse",
    ]);
    expect(ids("P3/arrivee", retour)).toEqual([
      "Q3.3.categorie",
      "Q3.3.adresse",
    ]);
  });

  it("un aller-retour équivalent se décrit dans le sens de l'aller, une seule fois", () => {
    const equivalent: Reponses = {
      ...DIALYSE,
      "Q3.1.2": "3_ALLER_RETOUR_EQUIVALENT",
    };
    // La maternité de Q3.8 a une adresse, mais n'est pas un lieu du trajet.
    const lieux = pages.filter(({ questions }) =>
      questions.some(
        ({ id }) => id.endsWith(".adresse") && !id.startsWith("Q3.8."),
      ),
    );
    expect(lieux.map(({ id }) => id)).toEqual(["P3/depart", "P3/arrivee"]);
    expect(ids("P3/arrivee", equivalent)).toEqual([
      "Q3.3.nom",
      "Q3.3.service",
      "Q3.3.adresse",
    ]);
  });

  it("une entrée arrive à l'établissement, et part du lieu que Q2.13 nomme", () => {
    const entree: Reponses = {
      ...ALLER,
      "Q2.1.g": "1_ENTREE",
      "Q2.13.depart": "3_EHPAD",
    };
    expect(ids("P3/depart", entree)).toEqual(["Q3.2.nom", "Q3.2.adresse"]);
    expect(posee("P3/depart", "Q3.2.nom", entree).reminder).toEqual([
      {
        label: "Lieu de départ",
        value:
          "Établissement d'Hébergement pour Personnes Âgées Dépendantes (EHPAD)",
      },
    ]);
  });

  it("une admission en HAD arrive au domicile, sans catégorie ni nom, et le départ n'en est pas un", () => {
    const had: Reponses = { ...ALLER, "Q2.1.g": "3_ADMISSION_HAD" };
    expect(ids("P3/arrivee", had)).toEqual(["Q3.3.adresse"]);
    expect(posee("P3/arrivee", "Q3.3.adresse", had).reminder).toEqual([
      {
        label: "Lieu d’arrivée",
        value:
          "Le domicile, pour l’admission en Hospitalisation à Domicile (HAD)",
      },
    ]);
    expect(options(posee("P3/depart", "Q3.2.categorie", had))).not.toContain(
      "1_DOMICILE",
    );
  });
});

describe("les contrôles des deux lieux", () => {
  const depuisLeDomicile: Reponses = {
    ...ALLER,
    "Q3.2.categorie": "1_DOMICILE",
    "Q3.2.adresse": ADRESSE,
  };

  it("après un départ du domicile, l'arrivée ne propose plus le domicile", () => {
    expect(
      options(posee("P3/arrivee", "Q3.3.categorie", depuisLeDomicile)),
    ).toEqual(["2_STRUCTURE_DE_SOINS", "3_AUTRE_LIEU"]);
  });

  it("une structure sans service se valide ; sans nom, non", () => {
    const sansNom: Reponses = {
      ...ALLER,
      "Q3.2.categorie": "2_STRUCTURE_DE_SOINS",
      "Q3.2.adresse": ADRESSE,
    };
    const depart = pages.filter(({ id }) => id === "P3/depart");
    const complete = (reponses: Reponses) =>
      new Questionnaire(depart).readWith(reponses, PMT).isComplete();
    expect(complete(sansNom)).toBe(false);
    expect(complete({ ...sansNom, "Q3.2.nom": "Cabinet Martin" })).toBe(true);
  });

  it("deux adresses identiques bloquent l'arrivée, aux espaces extrêmes et à la casse près", () => {
    const meme: Reponses = {
      ...depuisLeDomicile,
      "Q3.3.categorie": "2_STRUCTURE_DE_SOINS",
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
      "Q3.2.categorie": "1_DOMICILE",
      "Q3.2.adresse": {
        street: "Rue Neuve 1",
        city: "Bruxelles",
        country: "Belgique",
      },
    } as Reponses;
    expect(
      new EstablishAPreconisation(model).execute(avecLePays).cibles,
    ).toEqual(new EstablishAPreconisation(model).execute(seed.answers).cibles);
  });
});

type Categorie = Questions["Q3.2.categorie"];

describe("un changement de catégorie (02 § Q3.2/Q3.3, SQ-26)", () => {
  const STRUCTURE = "2_STRUCTURE_DE_SOINS" as const;
  const CLINIQUE = { "Q3.2.nom": "Clinique du Parc", "Q3.2.adresse": ADRESSE };
  const PAGE = pages.find(({ id }) => id === "P3/depart");
  if (!PAGE) throw new Error("P3/depart n'existe pas");
  const choisir = (brouillon: Reponses, categorie: Categorie) =>
    answerOnPage(PAGE, brouillon, "Q3.2.categorie", categorie);
  const brouillon: Reponses = { "Q3.2.categorie": STRUCTURE, ...CLINIQUE };

  it("efface le nom, et le retour ne le rend pas ; l'adresse reste", () => {
    const autreLieu = choisir(brouillon, "3_AUTRE_LIEU");
    const memeAdresse = { "Q3.2.adresse": ADRESSE };
    expect(autreLieu).toEqual({
      "Q3.2.categorie": "3_AUTRE_LIEU",
      ...memeAdresse,
    });
    const retour = choisir(autreLieu, STRUCTURE);
    expect(retour).toEqual({ "Q3.2.categorie": STRUCTURE, ...memeAdresse });
  });

  it("la même catégorie choisie à nouveau garde le nom", () => {
    expect(choisir(brouillon, STRUCTURE)).toEqual(brouillon);
  });
});
