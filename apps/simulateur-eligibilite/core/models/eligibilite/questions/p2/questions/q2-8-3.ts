// Q2.8.3 : la fin de la première permission. Elle suit son début (Q2.8.2), et
// n'en est pas à plus de 48 heures.

import { given, question } from "../../question.ts";
import { unMineurDeVingtAns } from "../conditions/permission.ts";

/** La durée maximale d'une permission, en heures. */
const DUREE_MAXIMALE_EN_HEURES = 48;

const debut = given.question("Q2.8.2").answer().toDate();
const fin = given.question("Q2.8.3").answer().toDate();

// Elle finit en même temps que son début, ou avant.
const neFinitPasApresSonDebut = fin.isAtOrBefore(debut);

// Elle dure plus de 48 heures. 48 heures pile sont permises.
const depasseQuaranteHuitHeures = fin.isAfter(
  debut.plusHours(DUREE_MAXIMALE_EN_HEURES),
);

export const Q2_8_3 = question
  .datetime("Q2.8.3", "Quand se termine cette première permission ?")
  .appliesWhen(unMineurDeVingtAns)
  .inconsistentWhen(
    neFinitPasApresSonDebut,
    "La fin de la permission doit venir après son début.",
  )
  .inconsistentWhen(
    depasseQuaranteHuitHeures,
    "Une permission dure au plus 48 heures.",
  );
