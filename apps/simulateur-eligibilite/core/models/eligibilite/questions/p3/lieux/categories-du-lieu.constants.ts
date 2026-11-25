// Les trois catégories d'un lieu de P3 (QST-LIEUX-TROIS-CATEGORIES-20261105) :
// la rubrique du cerfa où il se reporte. Elles sont documentaires : une
// catégorie ne prouve aucune nature précise, et la nature que P2 prouve garde
// la sienne (`CONTRAT_LIEUX_CERFA.json`, `presentation`).

/** Les catégories, dans l'ordre de l'écran. */
export const CATEGORIES = {
  "1_DOMICILE": "Domicile",
  "2_STRUCTURE_DE_SOINS": "Structure de soins",
  "3_AUTRE_LIEU": "Autre lieu",
} as const;

export type Categorie = keyof typeof CATEGORIES;

/** Le HTNM, tel que la nature du lieu le nomme. */
export const HTNM = "Hébergement Temporaire Non Médicalisé (HTNM)";
