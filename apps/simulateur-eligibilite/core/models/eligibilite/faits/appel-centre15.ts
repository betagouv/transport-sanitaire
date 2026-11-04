// fait_appel_centre15 : appel effectif au SAMU-Centre 15.
//
// L'option 3 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Non proposée, il reste absent.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";
import { PAS_ENCORE_ETABLI } from "./noms.ts";

export const appelCentre15 = unFait("fait_appel_centre15")
  .ouiSi(given.question("Q2.6").answer().checked("3_CENTRE_QUINZE"))
  .nonSiEcartee(given.question("Q2.6").answer(), "3_CENTRE_QUINZE")
  .sinon(PAS_ENCORE_ETABLI);
