// Q3.6.3 : la date de l'accident causé par un tiers (Q3.6.2).

import { given, question } from "../../question.ts";
import { DATE_FUTURE, dansLeFutur } from "../conditions/evenements.ts";
import { Q3_6_2 } from "./q3-6-2.ts";

// La question, avant la règle qui lit sa réponse.
const declaree = question
  .date("Q3.6.3", "Quelle est la date de l’accident causé par un tiers ?")
  .appliesWhen(given.question(Q3_6_2).answer().is("1_OUI"))
  .dependsOn(Q3_6_2);

export const Q3_6_3 = declaree.inconsistentWhen(
  dansLeFutur(declaree),
  DATE_FUTURE,
);
