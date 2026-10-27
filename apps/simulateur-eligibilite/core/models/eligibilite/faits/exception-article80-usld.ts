// fait_exception_article80_usld : USLD hors même implantation.
//
// L'option 6 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Sans Q2.6, il reste absent.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import { EXCEPTIONS } from "./communs.ts";

export const exceptionArticle80Usld = unFait("fait_exception_article80_usld")
  .ouiSi(EXCEPTIONS.checked("6_USLD"))
  .nonSiEcartee(EXCEPTIONS, "6_USLD")
  .inconnuSi(EXCEPTIONS.isPresent(), "« 6_USLD » ne s'est pas proposée.")
  .sinon(PAS_ENCORE_ETABLI);
