// fait_appel_centre15 : appel effectif au SAMU-Centre 15.
//
// L'option 3 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Non proposée, il reste absent.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import { EXCEPTIONS } from "./communs.ts";

export const appelCentre15 = unFait("fait_appel_centre15")
  .ouiSi(EXCEPTIONS.checked("3_CENTRE_QUINZE"))
  .nonSiEcartee(EXCEPTIONS, "3_CENTRE_QUINZE")
  .sinon(PAS_ENCORE_ETABLI);
