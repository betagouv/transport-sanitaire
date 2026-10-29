// fait_exception_article80_admission_sans_sejour : admission dans le nouvel
// établissement sans prestation initiale.
//
// L'option 2 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Sans Q2.6, il reste absent.
// Elle ne se propose que pour un transfert définitif sans séjour initial :
// sinon, il vaut « non », avec sa raison.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import {
  DEPLACEMENT,
  EXCEPTIONS,
  given,
  UN_SEJOUR_EN_ETABLISSEMENT,
} from "./communs.ts";

export const exceptionArticle80AdmissionSansSejour = unFait(
  "fait_exception_article80_admission_sans_sejour",
)
  .ouiSi(EXCEPTIONS.checked("2_ADMISSION_SANS_SEJOUR"))
  .nonSiEcartee(EXCEPTIONS, "2_ADMISSION_SANS_SEJOUR")
  .nonSi(
    EXCEPTIONS.isPresent().and(UN_SEJOUR_EN_ETABLISSEMENT),
    "Elle ne s'est pas proposée : un séjour initial en établissement est coché en Q2.2.1.",
  )
  .nonSi(
    EXCEPTIONS.isPresent().and(DEPLACEMENT.is("2_AUTRE_DEPLACEMENT")),
    "Elle ne s'est pas proposée : un autre déplacement n'est pas un transfert.",
  )
  .nonSi(
    EXCEPTIONS.isPresent().and(
      given.question("Q2.6.a").answer().is("2_PROVISOIRE"),
    ),
    "Elle ne s'est pas proposée : un transfert provisoire revient à l'établissement d'origine.",
  )
  .nonSi(
    EXCEPTIONS.isPresent(),
    "Elle ne s'est pas proposée : une admission ou un séjour en HAD n'est pas un transfert entre établissements.",
  )
  .sinon(PAS_ENCORE_ETABLI);
