// Q2.3.1 : la distance du trajet évalué.

import { question } from "../../question.ts";

export const Q2_3_1 = question
  .singleChoice(
    "Q2.3.1",
    "Quelle distance sépare les lieux de départ et d’arrivée ?",
  )
  .options({
    "1_CINQUANTE_KM_OU_MOINS": "50 km ou moins.",
    "2_PLUS_DE_CINQUANTE_KM": "Plus de 50 km, jusqu’à 150 km inclus.",
    "3_PLUS_DE_CENT_CINQUANTE_KM": "Plus de 150 km.",
  });
