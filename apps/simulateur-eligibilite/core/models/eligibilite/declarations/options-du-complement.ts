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
    "Établissement d'Hébergement pour Personnes Âgées Dépendantes (EHPAD)",
  "4_USLD": "Unité de Soins de Longue Durée (USLD)",
  "5_HEBERGEMENT_NON_MEDICALISE":
    "Hébergement, notamment Hébergement Temporaire Non Médicalisé (HTNM)",
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
  /** Un trajet vers un centre de référence pour une maladie rare ? (Q3.4.a.) */
  "Q3.4.a": {
    "1_OUI": "Oui",
    "2_NON": "Non",
  },
  /** Un accident causé par un tiers en rapport avec ce trajet ? (Q3.6.) */
  "Q3.6.2": {
    "1_OUI": "Oui",
    "2_NON": "Non",
  },
  /**
   * Un cas particulier d’exonération du ticket modérateur ? (Q3.7.) Les cas
   * reprennent les notices des cerfa, seuils compris (D-123). Les cas 3 et 4
   * sont ceux de la PMT et du S3141, le cas 6 celui de la DAP.
   */
  "Q3.7": {
    "1_ACTE_LOURD":
      "Un acte réalisé lors de l’hospitalisation a un coefficient égal ou supérieur à K60, ou un tarif égal ou supérieur à 120 euros.",
    "2_TRANSFERT_CONSECUTIF":
      "Un transfert en lien direct et consécutif avec une première hospitalisation exonérée en raison d’un K60 ou d’un tarif de 120 euros.",
    "3_URGENCE_HOSPITALIERE":
      "Un transport d’urgence pour une hospitalisation où est effectué un acte coûteux, ou pour une hospitalisation qui en découle directement.",
    "4_HAD_OU_RADIOTHERAPIE":
      "Un transport entre l’établissement et le domicile en Hospitalisation à Domicile (HAD), prescrit hors protocole HAD, ou pour des séances de radiothérapie en structure libérale ou en centre de santé.",
    "5_NOUVEAU_NE":
      "Un transport lié à l’hospitalisation d’un nouveau-né de moins de trente jours.",
    "6_TRAITEMENT_MIEUX_ADAPTE":
      "Un transfert vers un autre établissement d’hospitalisation, pour un traitement mieux adapté à l’état de santé, sauf vers un établissement de soins de suite et de réadaptation.",
    "7_AUCUN": "Aucun autre cas parmi ceux proposés.",
  },
} as const;
