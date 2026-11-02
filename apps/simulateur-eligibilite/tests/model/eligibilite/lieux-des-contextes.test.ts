// Les lieux que les contextes de P2 fixent ou bornent en P3 (Q3.2, Q3.3, #145) :
// la matrice des lieux de `CATALOGUE_COMPLET_QUESTIONS.md`, lue dans le sens
// du document (D-121).

import { describe, expect, it } from "vitest";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import {
  ADRESSE,
  ALLER,
  ids,
  naturesDe,
  RETOUR,
  type Reponses,
  rappel,
} from "./questions-des-lieux";

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

  it("une entrée garde l'USLD de Q2.6 : l'arrivée se choisit entre l'établissement et l'USLD", () => {
    const entree: Reponses = {
      ...ALLER,
      "Q2.1.g": "1_ENTREE",
      "Q2.6": ["6_USLD"],
    };
    const depuis = (nature: Questions["Q3.2.nature"]) =>
      naturesDe("P3/arrivee", "Q3.3.nature", {
        ...entree,
        "Q3.2.nature": nature,
        "Q3.2.adresse": ADRESSE,
      });
    expect(depuis("4_USLD")).toEqual(["2_ETABLISSEMENT_DE_SANTE", "4_USLD"]);
    expect(depuis("1_DOMICILE")).toEqual(["4_USLD"]);
  });

  it("une sortie aussi : le départ se choisit entre l'établissement et l'USLD", () => {
    const sortie: Reponses = {
      ...RETOUR,
      "Q2.2.1": ["1_HOSPITALISATION"],
      "Q2.1.g": "2_SORTIE",
      "Q2.6": ["6_USLD"],
    };
    expect(naturesDe("P3/depart", "Q3.2.nature", sortie)).toEqual([
      "2_ETABLISSEMENT_DE_SANTE",
      "4_USLD",
    ]);
  });

  it("l'EHPAD de Q2.6 aussi", () => {
    const ehpad: Reponses = {
      ...ALLER,
      "Q2.6": ["7_EHPAD"],
      "Q3.2.nature": "8_AUTRE_LIEU",
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
      "7_CABINET",
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
      "7_CABINET",
    ]);
  });

  it("une admission en HAD de Q2.6 part de l'établissement vers le domicile", () => {
    const had: Reponses = { ...RETOUR, "Q2.6": ["10_ADMISSION_HAD"] };
    expect(ids("P3/depart", had)).toEqual(["Q3.2.nom", "Q3.2.adresse"]);
    expect(ids("P3/arrivee", had)).toEqual(["Q3.3.adresse"]);
  });
});
