// Q2.2.5 : les adresses à l'étranger, sous la situation de Q2.2.1 qui l'ouvre.

import { given, question } from "../../question.ts";
import { Q2_2_1 } from "./q2-2-1.ts";

export const Q2_2_5 = question
  .multipleChoice(
    "Q2.2.5",
    "Sélectionnez la ou les adresses situées à l’étranger",
  )
  .options({
    "1_DEPART": "Adresse de départ située à l’étranger.",
    "2_ARRIVEE": "Adresse d’arrivée située à l’étranger.",
    "3_LIEU_DES_SOINS":
      "Adresse du lieu de soins située à l’étranger (à ne sélectionner que si elle est différente des adresses de départ et d’arrivée).",
  })
  .appliesWhen(given.question(Q2_2_1).answer().checked("2_ETRANGER"));
