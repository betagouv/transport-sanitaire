// Les lieux que les contextes de P2 fixent ou bornent en P3 (Q3.2, Q3.3, #145) :
// la matrice des lieux de `CATALOGUE_COMPLET_QUESTIONS.md`, lue dans le sens
// du document (D-121).

import { describe, expect, it } from "vitest";
import { model } from "../../../front/models/eligibilite";
import type { Questions } from "../../../front/models/eligibilite/declarations/questions";
import { askedQuestions } from "../../../front/socle/questionnaire-engine/asked-questions";
import type {
  Answers,
  AnyCibles,
} from "../../../front/socle/questionnaire-engine/question";

type Reponses = Answers<Questions>;

const pages = model.cerfa.part.pages;
const PMT = { cible_support_id: "S3138g" } as AnyCibles;
const ALLER: Reponses = { "Q3.1.1": 1, "Q3.1.2": "1_ALLER" };
const RETOUR: Reponses = { "Q3.1.1": 1, "Q3.1.2": "2_RETOUR" };
const ADRESSE = {
  street: "1 rue de la Paix",
  postalCode: "75002",
  city: "Paris",
};

const posees = (pageId: string, reponses: Reponses, cibles = PMT) => {
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
const rappel = (pageId: string, id: keyof Questions, reponses: Reponses) =>
  posee(pageId, id, reponses).reminder;
const naturesDe = (pageId: string, id: keyof Questions, reponses: Reponses) => {
  const question = posee(pageId, id, reponses);
  return question.kind === "single choice"
    ? question.options.map(({ value }) => value)
    : [];
};

describe("les lieux que les contextes de P2 fixent (matrice des lieux)", () => {
  it("un retour pénitentiaire arrive à l'établissement pénitentiaire", () => {
    const penitentiaire: Reponses = {
      ...RETOUR,
      "Q2.2.1": ["3_AUTRE_CADRE"],
      "Q2.2.1.b": ["10_RETOUR_PENITENTIAIRE"],
    };
    expect(ids("P3/arrivee", penitentiaire)).toEqual([
      "Q3.3.nom",
      "Q3.3.adresse",
    ]);
    expect(rappel("P3/arrivee", "Q3.3.nom", penitentiaire)).toEqual([
      {
        label: "Lieu d’arrivée",
        value: "L’établissement pénitentiaire où le patient retourne",
      },
    ]);
  });

  it("un transfert entre établissements ne propose que des établissements", () => {
    const transfert: Reponses = { ...ALLER, "Q2.5": "1_TRANSFERT" };
    expect(naturesDe("P3/depart", "Q3.2.nature", transfert)).toEqual([
      "2_ETABLISSEMENT_DE_SANTE",
      "3_EHPAD",
      "4_USLD",
    ]);
  });

  it("l'USLD de Q2.6 est l'un des deux lieux : l'arrivée l'impose si le départ n'en est pas une", () => {
    const usld: Reponses = {
      ...ALLER,
      "Q2.5": "1_TRANSFERT",
      "Q2.6": ["6_USLD"],
    };
    const depuis = (nature: Questions["Q3.2.nature"]) =>
      naturesDe("P3/arrivee", "Q3.3.nature", {
        ...usld,
        "Q3.2.nature": nature,
        "Q3.2.adresse": ADRESSE,
      });
    expect(depuis("2_ETABLISSEMENT_DE_SANTE")).toEqual(["4_USLD"]);
    expect(depuis("4_USLD")).toEqual([
      "2_ETABLISSEMENT_DE_SANTE",
      "3_EHPAD",
      "4_USLD",
    ]);
  });

  it("l'USLD de Q2.6 s'impose au départ quand P2 fixe l'arrivée", () => {
    const entree: Reponses = {
      ...ALLER,
      "Q2.1.g": "1_ENTREE",
      "Q2.6": ["6_USLD"],
    };
    expect(naturesDe("P3/depart", "Q3.2.nature", entree)).toEqual(["4_USLD"]);
  });

  it("l'EHPAD de Q2.6 aussi", () => {
    const ehpad: Reponses = {
      ...ALLER,
      "Q2.6": ["7_EHPAD"],
      "Q3.2.nature": "7_AUTRE_LIEU",
      "Q3.2.adresse": ADRESSE,
    };
    expect(naturesDe("P3/arrivee", "Q3.3.nature", ehpad)).toEqual(["3_EHPAD"]);
  });

  it("une radiothérapie en ville part de l'établissement d'origine, vers un centre ou un cabinet", () => {
    const radiotherapie: Reponses = {
      ...ALLER,
      "Q2.5": "1_TRANSFERT",
      "Q2.6": ["8_RADIOTHERAPIE"],
    };
    expect(rappel("P3/depart", "Q3.2.nom", radiotherapie)).toEqual([
      {
        label: "Lieu de départ",
        value: "L’établissement d’origine du transfert",
      },
    ]);
    expect(naturesDe("P3/arrivee", "Q3.3.nature", radiotherapie)).toEqual([
      "2_ETABLISSEMENT_DE_SANTE",
      "7_AUTRE_LIEU",
    ]);
  });

  it("avec une radiothérapie en ville, l'USLD de Q2.6 est l'établissement d'origine", () => {
    const depuisLUsld: Reponses = {
      ...ALLER,
      "Q2.5": "1_TRANSFERT",
      "Q2.6": ["6_USLD", "8_RADIOTHERAPIE"],
    };
    expect(naturesDe("P3/arrivee", "Q3.3.nature", depuisLUsld)).toEqual([
      "2_ETABLISSEMENT_DE_SANTE",
      "7_AUTRE_LIEU",
    ]);
  });

  it("une admission en HAD de Q2.6 part de l'établissement vers le domicile", () => {
    const had: Reponses = { ...RETOUR, "Q2.6": ["10_ADMISSION_HAD"] };
    expect(ids("P3/depart", had)).toEqual(["Q3.2.nom", "Q3.2.adresse"]);
    expect(ids("P3/arrivee", had)).toEqual(["Q3.3.adresse"]);
  });

  it("plusieurs permissions du S3141 vont de l'établissement au lieu de séjour, sans Q3.1.2", () => {
    const S3141 = { cible_support_id: "S3141" } as AnyCibles;
    const permissions: Reponses = {
      "Q2.1": "11_PERMISSION",
      "Q2.8.5": "1_OUI",
    };
    expect(
      posees("P3/depart", permissions, S3141).find(
        ({ id }) => id === "Q3.2.nom",
      )?.reminder,
    ).toEqual([
      {
        label: "Lieu de départ",
        value: "L’établissement de santé où le patient séjourne",
      },
    ]);
    expect(
      posees("P3/arrivee", permissions, S3141).map(({ id }) => id),
    ).toEqual(["Q3.3.adresse"]);
  });

  it("le retour d'une permission part du lieu de séjour", () => {
    const retour: Reponses = { ...RETOUR, "Q2.2.1.a": "1_OUI" };
    expect(ids("P3/depart", retour)).toEqual(["Q3.2.adresse"]);
    expect(rappel("P3/arrivee", "Q3.3.nom", retour)).toEqual([
      {
        label: "Lieu d’arrivée",
        value: "L’établissement de santé où le patient séjourne",
      },
    ]);
  });

  it("le HTNM est l'arrivée de l'aller et le départ du retour", () => {
    const htnm: Reponses = {
      "Q2.2.1": ["3_AUTRE_CADRE"],
      "Q2.2.1.b": ["5_HTNM"],
    };
    const lieu = [
      {
        label: "Lieu d’arrivée",
        value: "L’hébergement temporaire non médicalisé",
      },
    ];
    expect(rappel("P3/arrivee", "Q3.3.nom", { ...ALLER, ...htnm })).toEqual(
      lieu,
    );
    expect(rappel("P3/depart", "Q3.2.nom", { ...RETOUR, ...htnm })).toEqual([
      { ...lieu[0], label: "Lieu de départ" },
    ]);
  });
});
