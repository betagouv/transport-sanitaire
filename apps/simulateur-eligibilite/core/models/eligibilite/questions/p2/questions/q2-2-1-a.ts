// Q2.2.1.a : la permission temporaire de sortie, pendant un séjour dans un
// établissement de santé. Une HAD ne l'ouvre pas.

import { question } from "../../question.ts";
import { unSejourEnEtablissement } from "../conditions/sejour.ts";

export const Q2_2_1_A = question
  .singleChoice(
    "Q2.2.1.a",
    "Ce trajet correspond-il à une permission temporaire de sortie de l’hôpital ?",
  )
  .options({
    "1_OUI": "Oui.",
    "2_NON": "Non.",
  })
  .appliesWhen(unSejourEnEtablissement);
