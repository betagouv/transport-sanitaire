// fait_exception_article80_admission_had : retour à domicile pour admission en
// HAD.
//
// L'option 10 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Sans Q2.6, il reste absent.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";
import { PAS_ENCORE_ETABLI } from "./noms.ts";

export const exceptionArticle80AdmissionHad = unFait(
  "fait_exception_article80_admission_had",
)
  .ouiSi(given.question("Q2.6").answer().checked("10_ADMISSION_HAD"))
  .nonSiEcartee(given.question("Q2.6").answer(), "10_ADMISSION_HAD")
  .inconnuSi(
    given.question("Q2.6").answer().isPresent(),
    "« 10_ADMISSION_HAD » ne s'est pas proposée.",
  )
  .sinon(PAS_ENCORE_ETABLI);
