// La catégorie d'un lieu de P3 d'après la nature que P2 prouve, et cette nature
// en toutes lettres (`categories-du-lieu.constants.ts`).

import type { Nature } from "../../p2/lieux/natures-du-lieu.constants.ts";
import { type Categorie, HTNM } from "./categories-du-lieu.constants.ts";

/** Aucune nature prouvée ne s'écrit : elle se saisit. */
type ASaisir = undefined;

export class CategoriesDuLieu {
  /** La catégorie d'une nature précise (`kindToCategory`). */
  static categorieDe(nature: Nature): Categorie {
    return CATEGORIES_DES_NATURES[nature];
  }

  /**
   * La nature d'un autre lieu en toutes lettres, quand elle est prouvée : elle
   * ne se saisit pas. Un autre lieu sans nature prouvée la demande.
   */
  static natureEnLettres(nature: Nature | undefined): string | ASaisir {
    return nature && NATURES_EN_LETTRES[nature];
  }
}

// ---- implémentation ----

const CATEGORIES_DES_NATURES: Record<Nature, Categorie> = {
  "1_DOMICILE": "1_DOMICILE",
  "2_ETABLISSEMENT_DE_SANTE": "2_STRUCTURE_DE_SOINS",
  "3_EHPAD": "3_AUTRE_LIEU",
  "4_USLD": "2_STRUCTURE_DE_SOINS",
  "5_HEBERGEMENT_NON_MEDICALISE": "3_AUTRE_LIEU",
  "6_ETABLISSEMENT_PENITENTIAIRE": "3_AUTRE_LIEU",
  "7_CABINET": "2_STRUCTURE_DE_SOINS",
  "8_AUTRE_LIEU": "3_AUTRE_LIEU",
};

// Les libellés de `placeNature` (`projection-lieux.mjs`). Le HTNM que P2
// établit vient d'un choix explicite : Q2.2.1 ou Q2.13.
const NATURES_EN_LETTRES: Partial<Record<Nature, string>> = {
  "3_EHPAD":
    "Établissement d’Hébergement pour Personnes Âgées Dépendantes (EHPAD)",
  "5_HEBERGEMENT_NON_MEDICALISE": HTNM,
  "6_ETABLISSEMENT_PENITENTIAIRE": "Établissement pénitentiaire",
};
