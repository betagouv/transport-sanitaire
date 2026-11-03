// La facturation : la réponse qui dit si l'adresse est en France ou à
// l'étranger.

import { question } from "../../question.ts";

export const FACTURATION = question
  .singleChoice("facturation", "Où envoyer la facture ?")
  .hint(
    "Démontre : la réponse qui dit, à la page suivante, si l'adresse est en France ou à l'étranger.",
  );
