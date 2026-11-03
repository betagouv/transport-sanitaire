// Q2.2.5 : les adresses à l'étranger, sous la situation de Q2.2.1 qui l'ouvre.

import { given, question } from "../../question.ts";

export const Q2_2_5 = question
  .multipleChoice(
    "Q2.2.5",
    "Sélectionnez la ou les adresses situées à l’étranger",
  )
  .appliesWhen(given.question("Q2.2.1").answer().checked("2_ETRANGER"));
