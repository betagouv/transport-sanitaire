// Q2.8.3 : la fin de la première permission, une date seule
// (DATES-SEULES-20261104). Elle ne précède pas son début (Q2.8.2) : une
// permission sur une seule date est possible. Sa durée se déclare en
// Q2.8.duree_48h.

import { given, question } from "../../question.ts";
import { unMineurDeVingtAns } from "../conditions/permission.ts";
import { Q2_8_2 } from "./q2-8-2.ts";

// La question, avant les règles qui lisent sa réponse.
const declaree = question.date(
  "Q2.8.3",
  "Quand se termine cette première permission ?",
);

const debut = given.question(Q2_8_2).answer().toDate();
const fin = given.question(declaree).answer().toDate();

export const Q2_8_3 = declaree
  .appliesWhen(unMineurDeVingtAns)
  .inconsistentWhen(
    fin.isBefore(debut),
    "La fin de la permission ne peut pas précéder son début.",
  );
