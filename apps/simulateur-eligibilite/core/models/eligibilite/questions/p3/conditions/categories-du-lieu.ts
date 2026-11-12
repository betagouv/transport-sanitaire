// Les trois catégories d'un lieu de P3 (QST-LIEUX-TROIS-CATEGORIES-20261105) :
// la rubrique du cerfa où il se reporte. Elles sont documentaires : une
// catégorie ne prouve aucune nature précise, et la nature que P2 prouve garde
// la sienne (`CONTRAT_LIEUX_CERFA.json`, `presentation`).

import type { Nature } from "../../p2/conditions/natures-du-lieu.ts";

/** Les catégories, dans l'ordre de l'écran. */
export const CATEGORIES = {
  "1_DOMICILE": "Domicile",
  "2_STRUCTURE_DE_SOINS": "Structure de soins",
  "3_AUTRE_LIEU": "Autre lieu",
} as const;

export type Categorie = keyof typeof CATEGORIES;

/** La catégorie n'est ni fixée, ni encore choisie. */
export type NonChoisie = undefined;

/** Aucune nature prouvée ne s'écrit : elle se saisit. */
type ASaisir = undefined;

/** Le HTNM, tel que la nature du lieu le nomme. */
export const HTNM = "Hébergement Temporaire Non Médicalisé (HTNM)";

/** La catégorie d'une nature précise (`kindToCategory`). */
export function categorieDe(nature: Nature): Categorie {
  return CATEGORIES_DES_NATURES[nature];
}

/**
 * La nature d'un autre lieu en toutes lettres, quand elle est prouvée : elle
 * ne se saisit pas. Un autre lieu sans nature prouvée la demande.
 */
export function natureEnLettres(nature: Nature | undefined): string | ASaisir {
  return nature && NATURES_EN_LETTRES[nature];
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
