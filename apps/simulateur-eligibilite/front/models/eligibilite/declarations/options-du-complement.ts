// Les options de P3, le complément du cerfa, dans l'ordre du catalogue.

/**
 * La nature d'un lieu du trajet (Q3.2, Q3.3), dans l'ordre de Q2.13. Le
 * cabinet et l'autre lieu sont deux natures (`CONTRAT_LIEUX_CERFA.json`) : la
 * huitième ne suit plus Q2.13, qui garde « D’un autre lieu. »
 */
const NATURES_DU_LIEU = {
  "1_DOMICILE": "Domicile ou autre lieu de vie",
  "2_ETABLISSEMENT_DE_SANTE": "Établissement de santé ou centre de soins",
  "3_EHPAD":
    "EHPAD (Établissement d'Hébergement pour Personnes Âgées Dépendantes)",
  "4_USLD": "USLD (Unité de Soins de Longue Durée)",
  "5_HEBERGEMENT_NON_MEDICALISE":
    "Hébergement, notamment HTNM (Hébergement Temporaire Non Médicalisé)",
  "6_ETABLISSEMENT_PENITENTIAIRE": "Établissement pénitentiaire",
  "7_CABINET": "Cabinet d’un professionnel de santé",
  "8_AUTRE_LIEU": "Autre lieu",
} as const;

export const OPTIONS_DU_COMPLEMENT = {
  /**
   * Comment ces transports sont-ils organisés ? (Q3.1, deuxième point du
   * catalogue.) « Aller-retour différent » bloque : une autre simulation
   * traite l'autre sens (TS1001-03).
   */
  "Q3.1.2": {
    "1_ALLER": "Aller simple",
    "2_RETOUR": "Retour simple",
    "3_ALLER_RETOUR_EQUIVALENT":
      "Aller-retour équivalent (mêmes faits en tout point, extrémités inversées)",
    "4_ALLER_RETOUR_DIFFERENT": "Aller-retour différent",
  },
  /** Quel est le lieu de départ ? (Q3.2, premier point du catalogue.) */
  "Q3.2.nature": NATURES_DU_LIEU,
  /** Quel est le lieu d’arrivée ? (Q3.3, premier point du catalogue.) */
  "Q3.3.nature": NATURES_DU_LIEU,
} as const;
