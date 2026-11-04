// Q2.8.4 : l'autorisation de la permission par l'établissement.

import { question } from "../../question.ts";
import { unMineurDeVingtAns } from "../conditions/permission.ts";

export const Q2_8_4 = question
  .singleChoice(
    "Q2.8.4",
    "Cette permission a-t-elle été autorisée par l’établissement après avis favorable du médecin chef de service ?",
  )
  // L'autorisation de la permission, sous-question de Q2.8 (D-107).
  .options({
    "1_OUI": "Oui.",
    "2_NON": "Non.",
  })
  .appliesWhen(unMineurDeVingtAns);
