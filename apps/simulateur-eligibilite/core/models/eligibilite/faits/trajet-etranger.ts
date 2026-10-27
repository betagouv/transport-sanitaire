// fait_trajet_etranger : le départ ou l'arrivée du trajet évalué est hors de
// France.
//
// L'étranger, proposé et écarté en Q2.2.1, le met à « non ». Sinon, Q2.2.5 le
// dit : une extrémité à l'étranger l'établit, le seul lieu des soins ne suffit
// pas.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import { given, SITUATIONS } from "./communs.ts";

const EXTREMITES = given.question("Q2.2.5").answer();

export const trajetEtranger = unFait("fait_trajet_etranger")
  .nonSiEcartee(SITUATIONS, "2_ETRANGER", "« l'étranger » proposé, non coché.")
  .ouiSi(EXTREMITES.checked("1_DEPART").or(EXTREMITES.checked("2_ARRIVEE")))
  .nonSi(EXTREMITES.isPresent())
  .sinon(PAS_ENCORE_ETABLI);
