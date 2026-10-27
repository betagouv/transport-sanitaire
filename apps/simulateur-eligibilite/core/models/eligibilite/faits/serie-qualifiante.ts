// fait_serie_qualifiante : au moins quatre transports de plus de 50 km chacun
// au titre du même traitement, dans les deux mois du premier.
//
// Q2.3.3 porte sur la conjonction entière : « Non » ne dit pas quelle
// condition manque. Elle ne se pose pas sous 50 km (Q2.3.1) : la série reste
// alors absente, et les règles l'écartent par la distance.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";

const SERIE = given.question("Q2.3.3").answer();

export const serieQualifiante = unFait("fait_serie_qualifiante")
  .ouiSi(SERIE.is("1_OUI"))
  .nonSi(SERIE.is("2_NON"))
  .inconnuSi(
    given.question("Q2.3.1").answer().is("1_CINQUANTE_KM_OU_MOINS"),
    "Q2.3.3 ne se pose pas : le trajet ne dépasse pas 50 km.",
  )
  .sinon("Q2.3.3 n'est pas encore validée.");
