// fait_exception_article80_dialyse_domicile : patient pratiquant la dialyse à
// domicile.
//
// L'option 9 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Sans Q2.6, il reste absent.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { regles } from "../../../socle/index.ts";
import { ExceptionsDeLArticle80 } from "../concepts/exceptions-de-l-article-80.ts";
import {
  type DeclarationDeFait,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";

export const exceptionArticle80DialyseDomicile: DeclarationDeFait = ({
  validated,
}) =>
  regles()
    .retient(ExceptionsDeLArticle80.of(validated).fait("9_DIALYSE_A_DOMICILE"))
    .sinon(PAS_ENCORE_ETABLI);
