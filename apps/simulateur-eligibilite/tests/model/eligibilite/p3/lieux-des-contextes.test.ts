// Les lieux que les contextes de P2 fixent ou bornent en P3 (Q3.2, Q3.3, #145) :
// la matrice des lieux de `CATALOGUE_COMPLET_QUESTIONS.md`, lue dans le sens
// du document (D-121), puis reportée sur les trois catégories
// (QST-LIEUX-TROIS-CATEGORIES-20261105, #400).

import { describe, expect, it } from "vitest";
import { model } from "../../../../core/models/eligibilite";
import { preconisationOf } from "../../../../core/socle/simulation";
import {
  ADRESSE,
  ALLER,
  ids,
  optionsDe,
  posee,
  RETOUR,
  type Reponses,
  rappel,
} from "./questions-des-lieux";

describe("les lieux que les contextes de P2 fixent (matrice des lieux)", () => {
  it("un retour pénitentiaire arrive à l'établissement pénitentiaire", () => {
    const penitentiaire: Reponses = {
      ...RETOUR,
      "Q2.2.1": ["10_RETOUR_PENITENTIAIRE"],
      "Q2.2.1.b": ["0_AUCUN"],
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

  it("le sens choisi en Q2.13.sens oriente aussi les lieux (#365)", () => {
    const penitentiaire: Reponses = {
      "Q2.13.sens": "2_RETOUR",
      "Q3.1.1": 1,
      "Q2.2.1": ["10_RETOUR_PENITENTIAIRE"],
      "Q2.2.1.b": ["0_AUCUN"],
    };
    expect(ids("P3/arrivee", penitentiaire)).toEqual([
      "Q3.3.nom",
      "Q3.3.adresse",
    ]);
  });

  it("un transfert entre établissements ne propose ni le domicile, ni d'autre lieu que l'EHPAD", () => {
    const transfert: Reponses = { ...ALLER, "Q2.5": "1_TRANSFERT" };
    expect(optionsDe("P3/depart", "Q3.2.categorie", transfert)).toEqual([
      "2_STRUCTURE_DE_SOINS",
      "3_AUTRE_LIEU",
    ]);
  });

  it("une radiothérapie en ville part de l'établissement d'origine, vers une structure de soins", () => {
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
    expect(ids("P3/arrivee", radiotherapie)).toEqual([
      "Q3.3.nom",
      "Q3.3.service",
      "Q3.3.adresse",
    ]);
    expect(rappel("P3/arrivee", "Q3.3.nom", radiotherapie)).toEqual([
      { label: "Lieu d’arrivée", value: "Structure de soins" },
    ]);
  });

  it("une admission en HAD de Q2.6 part de l'établissement quitté vers le domicile, rappelés", () => {
    const had: Reponses = { ...RETOUR, "Q2.6": ["10_ADMISSION_HAD"] };
    expect(ids("P3/depart", had)).toEqual([
      "Q3.2.nom",
      "Q3.2.service",
      "Q3.2.adresse",
    ]);
    expect(ids("P3/arrivee", had)).toEqual(["Q3.3.adresse"]);
    expect(rappel("P3/depart", "Q3.2.nom", had)).toEqual([
      { label: "Lieu de départ", value: "L’établissement de santé quitté" },
    ]);
    expect(rappel("P3/arrivee", "Q3.3.adresse", had)).toEqual([
      {
        label: "Lieu d’arrivée",
        value:
          "Le domicile, pour l’admission en Hospitalisation à Domicile (HAD)",
      },
    ]);
  });
});

describe("le côté de l'USLD et de l'EHPAD de Q2.6 (#400, #421)", () => {
  const sortie: Reponses = {
    ...RETOUR,
    "Q2.2.1": ["1_HOSPITALISATION"],
    "Q2.1.g": "2_SORTIE",
    "Q2.6": ["6_USLD"],
    "Q3.2.adresse": ADRESSE,
  };

  it("retour à domicile depuis une USLD : rien n'est bloqué, aucune question de côté", () => {
    expect(ids("P3/depart", sortie)).toEqual([
      "Q3.2.nom",
      "Q3.2.service",
      "Q3.2.adresse",
    ]);
    expect(optionsDe("P3/arrivee", "Q3.3.categorie", sortie)).toContain(
      "1_DOMICILE",
    );
    expect(
      ids("P3/arrivee", { ...sortie, "Q3.3.categorie": "1_DOMICILE" }),
    ).toEqual(["Q3.3.categorie", "Q3.3.adresse"]);
  });

  it("USLD possible aux deux extrémités : une question de côté, une seule", () => {
    const versUneStructure: Reponses = {
      ...sortie,
      "Q3.3.categorie": "2_STRUCTURE_DE_SOINS",
    };
    expect(
      ids("P3/arrivee", versUneStructure).filter((id) => id.endsWith(".cote")),
    ).toEqual(["Q3.lieux.usld.cote"]);
    expect(
      optionsDe("P3/arrivee", "Q3.lieux.usld.cote", versUneStructure),
    ).toEqual(["1_DEPART", "2_ARRIVEE", "3_LES_DEUX"]);
    expect(
      posee("P3/arrivee", "Q3.lieux.usld.cote", versUneStructure).label,
    ).toBe("De quel côté se trouve l’unité de soins de longue durée (USLD) ?");
  });

  it.each(["2_ARRIVEE", "3_LES_DEUX"] as const)(
    "le côté répondu (%s) fait de l'arrivée l'USLD, rappelée nulle part ailleurs",
    (cote) => {
      const aLArrivee: Reponses = {
        ...sortie,
        "Q3.3.categorie": "2_STRUCTURE_DE_SOINS",
        "Q3.lieux.usld.cote": cote,
      };
      expect(ids("P3/arrivee", aLArrivee)).toEqual([
        "Q3.3.categorie",
        "Q3.lieux.usld.cote",
        "Q3.3.nom",
        "Q3.3.service",
        "Q3.3.adresse",
      ]);
    },
  );

  it("l'EHPAD d'un transfert entre deux autres lieux se demande en toutes lettres, les deux côtés compris", () => {
    const versUnAutreLieu: Reponses = {
      ...ALLER,
      "Q2.5": "1_TRANSFERT",
      "Q2.6": ["7_EHPAD"],
      "Q3.2.categorie": "3_AUTRE_LIEU",
      "Q3.2.adresse": ADRESSE,
      "Q3.3.categorie": "3_AUTRE_LIEU",
    };
    expect(
      posee("P3/arrivee", "Q3.lieux.ehpad.cote", versUnAutreLieu).label,
    ).toBe(
      "De quel côté se trouve l’établissement d’hébergement pour personnes âgées dépendantes (EHPAD) ?",
    );
    expect(
      optionsDe("P3/arrivee", "Q3.lieux.ehpad.cote", versUnAutreLieu),
    ).toEqual(["1_DEPART", "2_ARRIVEE", "3_LES_DEUX"]);
  });

  it("une entrée depuis le domicile place l'USLD à l'arrivée, sans le demander", () => {
    const entree: Reponses = {
      ...ALLER,
      "Q2.1.g": "1_ENTREE",
      "Q2.6": ["6_USLD"],
      "Q3.2.categorie": "1_DOMICILE",
      "Q3.2.adresse": ADRESSE,
    };
    expect(ids("P3/arrivee", entree)).toEqual([
      "Q3.3.nom",
      "Q3.3.service",
      "Q3.3.adresse",
    ]);
    expect(rappel("P3/arrivee", "Q3.3.nom", entree)).toEqual([
      {
        label: "Lieu d’arrivée",
        value: "Unité de Soins de Longue Durée (USLD)",
      },
    ]);
  });

  it("l'EHPAD de Q2.6 après un départ du domicile est l'arrivée, nommée en toutes lettres", () => {
    const ehpad: Reponses = {
      ...ALLER,
      "Q2.6": ["7_EHPAD"],
      "Q3.2.categorie": "1_DOMICILE",
      "Q3.2.adresse": ADRESSE,
    };
    expect(ids("P3/arrivee", ehpad)).toEqual(["Q3.3.nom", "Q3.3.adresse"]);
    expect(rappel("P3/arrivee", "Q3.3.nom", ehpad)).toEqual([
      {
        label: "Lieu d’arrivée",
        value:
          "Établissement d'Hébergement pour Personnes Âgées Dépendantes (EHPAD)",
      },
    ]);
  });

  it("l'USLD et l'EHPAD ne se placent pas au même lieu", () => {
    const lesDeux: Reponses = {
      ...ALLER,
      "Q2.5": "1_TRANSFERT",
      "Q2.6": ["6_USLD", "7_EHPAD"],
      "Q3.2.categorie": "3_AUTRE_LIEU",
      "Q3.2.adresse": ADRESSE,
    };
    expect(ids("P3/arrivee", lesDeux)).toEqual([
      "Q3.3.nom",
      "Q3.3.service",
      "Q3.3.adresse",
    ]);
    expect(rappel("P3/arrivee", "Q3.3.nom", lesDeux)).toEqual([
      {
        label: "Lieu d’arrivée",
        value: "Unité de Soins de Longue Durée (USLD)",
      },
    ]);
  });

  it("des lieux qui n'ont pas de place pour l'USLD de Q2.6 se corrigent au départ", () => {
    const had: Reponses = { ...RETOUR, "Q2.6": ["10_ADMISSION_HAD", "6_USLD"] };
    expect(posee("P3/depart", "Q3.2.adresse", had).inconsistencies).toContain(
      "Les lieux contredisent le type de structure établi en Q2.6 : corriger le trajet.",
    );
  });

  it("aucun changement de R2 en P3 : le côté répondu ne change pas l'issue", () => {
    const cibles = (cote: "1_DEPART" | "2_ARRIVEE" | "3_LES_DEUX") =>
      preconisationOf(model, {
        ...sortie,
        "Q3.3.categorie": "2_STRUCTURE_DE_SOINS",
        "Q3.lieux.usld.cote": cote,
      }).cibles;
    expect(cibles("1_DEPART")).toEqual(cibles("2_ARRIVEE"));
    expect(cibles("3_LES_DEUX")).toEqual(cibles("2_ARRIVEE"));
  });
});
