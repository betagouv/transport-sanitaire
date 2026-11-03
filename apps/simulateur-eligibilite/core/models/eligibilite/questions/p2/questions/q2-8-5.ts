// Q2.8.5 : la prescription couvre une ou plusieurs permissions. Q2.8.6 et
// Q3.1 en dépendent.

import { question } from "../../question.ts";
import { unMineurDeVingtAns } from "../conditions/permission.ts";

export const Q2_8_5 = question
  .singleChoice(
    "Q2.8.5",
    "La prescription couvre-t-elle plusieurs permissions ?",
  )
  .appliesWhen(unMineurDeVingtAns);
