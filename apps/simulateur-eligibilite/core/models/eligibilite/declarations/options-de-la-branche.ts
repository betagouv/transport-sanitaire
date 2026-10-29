// Les options de la page de branche (Q2.12 à Q2.14), dans l'ordre du catalogue.

export const OPTIONS_DE_LA_BRANCHE = {
  /**
   * Le patient devra effectuer son départ depuis… Les libellés sont ceux de
   * WORDING-07 et WORDING-P2-04 (v10.1.4), sigles après leur libellé.
   */
  "Q2.13.depart": {
    "1_DOMICILE": "Son domicile ou un autre lieu de vie",
    "2_ETABLISSEMENT_DE_SANTE": "Un établissement de santé.",
    "3_EHPAD":
      "Un Établissement d'Hébergement pour Personnes Âgées Dépendantes (EHPAD).",
    "4_USLD": "Une Unité de Soins de Longue Durée (USLD).",
    "5_HEBERGEMENT_NON_MEDICALISE": "Un hébergement temporaire non médicalisé.",
    "6_ETABLISSEMENT_PENITENTIAIRE": "Un établissement pénitentiaire.",
    "7_AUTRE_LIEU": "Un autre lieu.",
  },
  /**
   * Quelle situation d’éloignement concerne la patiente ? Premier groupe de
   * Q2.14, `CONTRAT_Q214_GROUPES.json`, groupe `eloignement`.
   */
  "Q2.14.eloignement": {
    "1_PLUS_DE_QUARANTE_CINQ_MINUTES":
      "Sa résidence se situe à plus de 45 minutes de trajet motorisé, dans les conditions habituelles, de la maternité la plus proche adaptée à son état de santé.",
    "2_COMMUNE_DESIGNEE_PAR_L_ARS":
      "Sa commune bénéficie d’une éligibilité définie par l’Agence Régionale de Santé (ARS) en raison de circonstances pouvant entraîner un éloignement supérieur à 45 minutes à la date prévue d’accouchement, notamment les conditions climatiques ou de circulation.",
    "3_AUCUNE": "Aucune de ces conditions.",
  },
  /**
   * Quel motif concerne le déplacement évalué ? Second groupe de Q2.14,
   * `CONTRAT_Q214_GROUPES.json`, groupe `finalite`.
   */
  "Q2.14.motif": {
    "1_EXAMEN_DU_HUITIEME_OU_NEUVIEME_MOIS":
      "Un examen médical obligatoire réalisé au cours du 8ᵉ ou du 9ᵉ mois de grossesse, dans une unité de gynécologie-obstétrique.",
    "2_HEBERGEMENT_ENGAGEMENT":
      "Un séjour dans un hébergement temporaire non médicalisé organisé dans le cadre du dispositif Engagement maternité.",
    "3_AUCUNE": "Aucune de ces conditions.",
  },
  /**
   * Attestez-vous que ce transport est urgent ? Même
   * question que Q2.3.4, réutilisée sur la page de branche (Q2.12).
   */
  "Q2.12": {
    "1_OUI": "Oui.",
    "2_NON": "Non.",
  },
} as const;
