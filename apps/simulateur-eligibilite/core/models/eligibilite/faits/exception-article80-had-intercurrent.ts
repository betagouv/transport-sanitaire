// fait_exception_article80_had_intercurrent : HAD, prestation hors soins liés
// à la HAD.
//
// L'option 5 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Sans Q2.6, il reste absent.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import { EXCEPTIONS } from "./communs.ts";

export const exceptionArticle80HadIntercurrent = unFait(
  "fait_exception_article80_had_intercurrent",
)
  .ouiSi(EXCEPTIONS.checked("5_HAD"))
  .nonSiEcartee(EXCEPTIONS, "5_HAD")
  .inconnuSi(EXCEPTIONS.isPresent(), "« 5_HAD » ne s'est pas proposée.")
  .sinon(PAS_ENCORE_ETABLI);
