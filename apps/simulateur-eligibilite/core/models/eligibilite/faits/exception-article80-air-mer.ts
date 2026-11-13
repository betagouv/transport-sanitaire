// fait_exception_article80_air_mer : segment aérien ou maritime relevant de
// l'exception.
//
// L'option 4 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Sans Q2.6, il reste absent.
// Elle ne se propose pas quand Q2.3.2 dit déjà une ligne régulière : il vaut
// alors « oui ». Pour la permission d'un adulte, Q2.6 ne se pose pas sur une
// ligne régulière : il vaut « oui » sans elle (QST-PERMISSION-EXCEPTIONS-20261113).
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";
import { PAS_ENCORE_ETABLI } from "./noms.ts";

export const exceptionArticle80AirMer = unFait(
  "fait_exception_article80_air_mer",
)
  .ouiSi(given.question("Q2.6").answer().checked("4_AIR_MER"))
  .nonSiEcartee(given.question("Q2.6").answer(), "4_AIR_MER")
  .ouiSi(
    given.question("Q2.6").answer().isPresent(),
    "La ligne régulière de Q2.3.2 se réutilise sans revote.",
  )
  .ouiSi(
    given
      .question("Q2.7")
      .answer()
      .is("3_ADULTE_AUTORISEE")
      .and(given.question("Q2.3.2").answer().is(true)),
    "La permission d'un adulte se fait sur une ligne régulière, dite en Q2.3.2.",
  )
  .sinon(PAS_ENCORE_ETABLI);
