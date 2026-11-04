// fait_exception_article80_radiotherapie : transfert provisoire pour
// radiothérapie en libéral ou centre de santé.
//
// L'option 8 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Sans Q2.6, il reste absent.
// Elle ne se propose que pour un transfert provisoire ou un autre
// déplacement : sinon, il vaut « non », avec sa raison.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";
import { PAS_ENCORE_ETABLI } from "./noms.ts";

export const exceptionArticle80Radiotherapie = unFait(
  "fait_exception_article80_radiotherapie",
)
  .ouiSi(given.question("Q2.6").answer().checked("8_RADIOTHERAPIE"))
  .nonSiEcartee(given.question("Q2.6").answer(), "8_RADIOTHERAPIE")
  .nonSi(
    given
      .question("Q2.6")
      .answer()
      .isPresent()
      .and(given.question("Q2.6.a").answer().is("1_DEFINITIF")),
    "Elle ne s'est pas proposée : transfert définitif.",
  )
  .nonSi(
    given.question("Q2.6").answer().isPresent(),
    "Elle ne s'est pas proposée : une admission en HAD n'est pas un transfert provisoire.",
  )
  .sinon(PAS_ENCORE_ETABLI);
