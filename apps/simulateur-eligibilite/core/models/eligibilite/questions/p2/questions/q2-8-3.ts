// Q2.8.3 : la fin de la première permission. Elle suit son début (Q2.8.2), et
// n'en est pas à plus de 48 heures.

import { given, question } from "../../question.ts";
import { unMineurDeVingtAns } from "../conditions/permission.ts";
import { Q2_8_2 } from "./q2-8-2.ts";

// La question, avant les règles qui lisent sa réponse.
const declaree = question.datetime(
  "Q2.8.3",
  "Quand se termine cette première permission ?",
);

/** La durée maximale d'une permission, en heures. */
const DUREE_MAXIMALE_EN_HEURES = 48;

const debut = given.question(Q2_8_2).answer().toDate();
const fin = given.question(declaree).answer().toDate();

// Elle finit en même temps que son début, ou avant.
const neFinitPasApresSonDebut = fin.isAtOrBefore(debut);

// Elle dure plus de 48 heures. 48 heures pile sont permises.
const depasseQuaranteHuitHeures = fin.isAfter(
  debut.plusHours(DUREE_MAXIMALE_EN_HEURES),
);

export const Q2_8_3 = declaree
  .appliesWhen(unMineurDeVingtAns)
  .inconsistentWhen(
    neFinitPasApresSonDebut,
    "La fin de la permission doit venir après son début.",
  )
  .inconsistentWhen(
    depasseQuaranteHuitHeures,
    "Une permission dure au plus 48 heures.",
  );
