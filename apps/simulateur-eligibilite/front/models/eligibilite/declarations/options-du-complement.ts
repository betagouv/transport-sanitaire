// Les options de P3, le complément du cerfa, dans l'ordre du catalogue.

/**
 * La nature d'un lieu du trajet (Q3.2, Q3.3). Le catalogue les nomme ; leur
 * ordre et leurs slugs sont ceux de Q2.13 : un départ qu'elle a établi est
 * déjà une nature.
 */
const NATURES_DU_LIEU = {
  "1_DOMICILE": "Domicile ou autre lieu de vie",
  "2_ETABLISSEMENT_DE_SANTE": "Établissement de santé ou centre de soins",
  "3_EHPAD": "EHPAD",
  "4_USLD": "Unité de soins de longue durée (USLD)",
  "5_HEBERGEMENT_NON_MEDICALISE": "Hébergement temporaire non médicalisé",
  "6_ETABLISSEMENT_PENITENTIAIRE": "Établissement pénitentiaire",
  "7_AUTRE_LIEU": "Cabinet ou autre lieu",
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
