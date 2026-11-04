// fait_exception_article80_dialyse_domicile : patient pratiquant la dialyse à
// domicile.
//
// L'option 9 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Sans Q2.6, il reste absent.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";
import { PAS_ENCORE_ETABLI } from "./noms.ts";

export const exceptionArticle80DialyseDomicile = unFait(
  "fait_exception_article80_dialyse_domicile",
)
  .ouiSi(given.question("Q2.6").answer().checked("9_DIALYSE_A_DOMICILE"))
  .nonSiEcartee(given.question("Q2.6").answer(), "9_DIALYSE_A_DOMICILE")
  .inconnuSi(
    given.question("Q2.6").answer().isPresent(),
    "« 9_DIALYSE_A_DOMICILE » ne s'est pas proposée.",
  )
  .sinon(PAS_ENCORE_ETABLI);
