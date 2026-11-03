// Q2.8.4 : l'autorisation de la permission par l'établissement.

import { question } from "../../question.ts";
import { unMineurDeVingtAns } from "../conditions/permission.ts";

export const Q2_8_4 = question
  .singleChoice(
    "Q2.8.4",
    "Cette permission a-t-elle été autorisée par l’établissement après avis favorable du médecin chef de service ?",
  )
  .appliesWhen(unMineurDeVingtAns);
