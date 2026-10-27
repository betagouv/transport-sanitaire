// fait_exception_article80_air_mer : segment aérien ou maritime relevant de
// l'exception.
//
// L'option 4 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Sans Q2.6, il reste absent.
// Elle ne se propose pas quand Q2.3.2 dit déjà une ligne régulière : il vaut
// alors « oui ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import { EXCEPTIONS } from "./communs.ts";

export const exceptionArticle80AirMer = unFait(
  "fait_exception_article80_air_mer",
)
  .ouiSi(EXCEPTIONS.checked("4_AIR_MER"))
  .nonSiEcartee(EXCEPTIONS, "4_AIR_MER")
  .ouiSi(
    EXCEPTIONS.isPresent(),
    "La ligne régulière de Q2.3.2 se réutilise sans revote.",
  )
  .sinon(PAS_ENCORE_ETABLI);
