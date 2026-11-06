// Q2.2.1.a : la permission temporaire de sortie, pendant un séjour dans un
// établissement de santé. Une HAD ne l'ouvre pas.

import { Q1_3 } from "../../p1/questions/q1-3.ts";
import { question } from "../../question.ts";
import { incoherenceDeLieux } from "../conditions/conflit-de-lieux.ts";
import { unSejourEnEtablissement } from "../conditions/sejour.ts";
import { Q2_1, Q2_1_G } from "./q2-1.ts";
import { Q2_2_1 } from "./q2-2-1.ts";
import { Q2_2_1_CADRE } from "./q2-2-1-cadre.ts";

// La question, avant l'incohérence qui lit sa réponse.
const enPermission = question
  .singleChoice(
    "Q2.2.1.a",
    "Ce trajet correspond-il à une permission temporaire de sortie de l’hôpital ?",
  )
  .options({
    "1_OUI": "Oui.",
    "2_NON": "Non.",
  })
  .appliesWhen(unSejourEnEtablissement);

// Une permission va de l'établissement au lieu de vie, ou en revient : une
// dialyse ou un hébergement la contredit.
export const Q2_2_1_A = enPermission.inconsistentWhen(
  ...incoherenceDeLieux("enPermission", {
    soins: Q1_3,
    motif: Q2_1,
    sousType: Q2_1_G,
    situations: Q2_2_1,
    sejour: Q2_2_1_CADRE,
    enPermission,
  }),
);
