// La nature d'un lieu du trajet (Q3.2, Q3.3) : les options des deux questions
// de nature, qu'elles partagent. Ce que P2 établit d'un lieu s'y rappelle sous
// leur libellé (`situations-des-lieux.ts`).

/**
 * Dans l'ordre de Q2.13. Le cabinet et l'autre lieu sont deux natures
 * (`CONTRAT_LIEUX_CERFA.json`) : la huitième ne suit plus Q2.13, qui garde
 * « D’un autre lieu. »
 */
export const NATURES_DU_LIEU = {
  "1_DOMICILE": "Domicile ou autre lieu de vie",
  "2_ETABLISSEMENT_DE_SANTE": "Établissement de santé ou centre de soins",
  "3_EHPAD":
    "Établissement d'Hébergement pour Personnes Âgées Dépendantes (EHPAD)",
  "4_USLD": "Unité de Soins de Longue Durée (USLD)",
  "5_HEBERGEMENT_NON_MEDICALISE":
    "Hébergement, notamment Hébergement Temporaire Non Médicalisé (HTNM)",
  "6_ETABLISSEMENT_PENITENTIAIRE": "Établissement pénitentiaire",
  "7_CABINET": "Cabinet d’un professionnel de santé",
  "8_AUTRE_LIEU": "Autre lieu",
} as const;

/** La nature d'un lieu, du domicile à l'autre lieu. */
export type Nature = keyof typeof NATURES_DU_LIEU;
