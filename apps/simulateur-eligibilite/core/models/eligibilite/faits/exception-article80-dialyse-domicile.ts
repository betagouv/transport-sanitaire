// fait_exception_article80_dialyse_domicile : patient pratiquant la dialyse à
// domicile.
//
// L'option 9 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Sans Q2.6, il reste absent.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import { EXCEPTIONS } from "./communs.ts";

export const exceptionArticle80DialyseDomicile = unFait(
  "fait_exception_article80_dialyse_domicile",
)
  .ouiSi(EXCEPTIONS.checked("9_DIALYSE_A_DOMICILE"))
  .nonSiEcartee(EXCEPTIONS, "9_DIALYSE_A_DOMICILE")
  .inconnuSi(
    EXCEPTIONS.isPresent(),
    "« 9_DIALYSE_A_DOMICILE » ne s'est pas proposée.",
  )
  .sinon(PAS_ENCORE_ETABLI);
