// Les options de P3, le complément du cerfa, dans l'ordre du catalogue.

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
} as const;
