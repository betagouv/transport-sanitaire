// fait_exception_article80_admission_had : retour à domicile pour admission en
// HAD.
//
// L'option 10 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Sans Q2.6, il reste absent.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import { EXCEPTIONS } from "./communs.ts";

export const exceptionArticle80AdmissionHad = unFait(
  "fait_exception_article80_admission_had",
)
  .ouiSi(EXCEPTIONS.checked("10_ADMISSION_HAD"))
  .nonSiEcartee(EXCEPTIONS, "10_ADMISSION_HAD")
  .inconnuSi(
    EXCEPTIONS.isPresent(),
    "« 10_ADMISSION_HAD » ne s'est pas proposée.",
  )
  .sinon(PAS_ENCORE_ETABLI);
