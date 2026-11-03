// Q3.6.3 : la date de l'accident causé par un tiers (Q3.6.2).

import { given, question } from "../../question.ts";
import { DATE_FUTURE, dansLeFutur } from "../conditions/evenements.ts";

export const Q3_6_3 = question
  .date("Q3.6.3", "Quelle est la date de l’accident causé par un tiers ?")
  .appliesWhen(given.question("Q3.6.2").answer().is("1_OUI"))
  .dependsOn("Q3.6.2")
  .inconsistentWhen(dansLeFutur("Q3.6.3"), DATE_FUTURE);
