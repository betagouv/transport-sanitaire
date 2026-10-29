// Les options de la convocation (Q2.10), sous le même format que `OPTIONS`
// (`questions.ts`) : le slug de chaque option, et son libellé du catalogue.

export const OPTIONS_DE_LA_CONVOCATION = {
  /** Quelle convocation, quel avis d’audience ou quel appareillage motive ce trajet ? */
  "Q2.10": {
    "1_CONTROLE_MEDICAL":
      "Convocation au contrôle médical de l’Assurance Maladie.",
    "2_EXPERT_JURIDICTION":
      "Convocation par un médecin-expert ou consultant désigné par une juridiction compétente.",
    "3_AUDIENCE_CONSULTATION":
      "Audience de cette juridiction comportant une consultation clinique.",
    "4_EXPERT_CONTESTATION":
      "Consultation d’un expert désigné pour une contestation médicale.",
    "5_COMMISSION_RECOURS":
      "Convocation d’une commission médicale de recours amiable ou du médecin désigné par elle.",
    "6_APPAREILLAGE": "Déplacement chez un fournisseur d’appareillage.",
    "7_AUCUNE": "Aucune de ces situations.",
  },
  /** Le fournisseur est-il agréé pour cet appareillage ? (option 6 de Q2.10) */
  "Q2.10.a": {
    "1_OUI": "Oui",
    "2_NON": "Non",
    "3_NE_PEUX_PAS_VERIFIER": "Je ne peux pas le vérifier",
  },
  /** Sélectionnez l’appareillage concerné (option 6 de Q2.10) */
  "Q2.10.b": {
    "1_PROTHESE_OCULAIRE_FACIALE": "Prothèse oculaire ou faciale",
    "2_PODO_ORTHESE": "Podo-orthèse",
    "3_ORTHOPROTHESE": "Orthoprothèse",
    "4_AUTRE": "Un autre appareillage",
    "5_NE_PEUX_PAS_PRECISER": "Je ne peux pas le vérifier",
  },
} as const;
