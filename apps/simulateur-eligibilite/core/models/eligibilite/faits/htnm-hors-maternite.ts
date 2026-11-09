// fait_htnm_hors_maternite : segment HTNM hors Engagement maternité.
//
// Q2.2.1 le dit. Le HTNM se dit hors Engagement maternité dans son libellé
// même (point 11), et ne se coche pas avec l'examen ou l'hébergement de la
// maternité (`CONTRAT_Q221_PROGRESSIF.json`) : une maternité cochée l'écarte
// donc, proposé et non coché.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";
import { PAS_ENCORE_ETABLI } from "./noms.ts";

export const htnmHorsMaternite = unFait("fait_htnm_hors_maternite")
  .ouiSi(given.question("Q2.2.1").answer().checked("5_HTNM"))
  .nonSiEcartee(given.question("Q2.2.1").answer(), "5_HTNM")
  .sinon(PAS_ENCORE_ETABLI);
