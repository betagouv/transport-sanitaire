// fait_exception_article80_ehpad : EHPAD hors même implantation.
//
// L'option 7 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Sans Q2.6, il reste absent.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import { EXCEPTIONS } from "./communs.ts";

export const exceptionArticle80Ehpad = unFait("fait_exception_article80_ehpad")
  .ouiSi(EXCEPTIONS.checked("7_EHPAD"))
  .nonSiEcartee(EXCEPTIONS, "7_EHPAD")
  .inconnuSi(EXCEPTIONS.isPresent(), "« 7_EHPAD » ne s'est pas proposée.")
  .sinon(PAS_ENCORE_ETABLI);
