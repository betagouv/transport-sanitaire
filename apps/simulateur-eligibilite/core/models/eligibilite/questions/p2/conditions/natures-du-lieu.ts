// La nature précise d'un lieu du trajet, que P2 prouve (`situations-des-lieux.ts`).
// Ce n'est plus une liste de P3, qui ne propose que trois catégories
// (QST-LIEUX-TROIS-CATEGORIES-20261105) : ce que P2 établit s'y rappelle sous
// ce libellé.

/**
 * Dans l'ordre de Q2.13. Le cabinet et l'autre lieu sont deux natures
 * (`CONTRAT_LIEUX_CERFA.json`) : la huitième ne suit plus Q2.13, qui garde
 * « D’un autre lieu. »
 */
export const NATURES_DU_LIEU = {
  "1_DOMICILE": "Domicile",
  "2_ETABLISSEMENT_DE_SANTE": "Établissement de santé ou centre de soins",
  "3_EHPAD":
    "Établissement d'Hébergement pour Personnes Âgées Dépendantes (EHPAD)",
  "4_USLD": "Unité de Soins de Longue Durée (USLD)",
  "5_HEBERGEMENT_NON_MEDICALISE":
    "Hébergement Temporaire Non Médicalisé (HTNM)",
  "6_ETABLISSEMENT_PENITENTIAIRE": "Établissement pénitentiaire",
  "7_CABINET": "Cabinet d’un professionnel de santé",
  "8_AUTRE_LIEU": "Autre lieu",
} as const;

/** La nature d'un lieu, du domicile à l'autre lieu. */
export type Nature = keyof typeof NATURES_DU_LIEU;
