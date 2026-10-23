// fait_exception_article80_usld : USLD hors même implantation.
//
// L'option 6 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Sans Q2.6, il reste absent.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { regles } from "../../../socle/index.ts";
import { ExceptionsDeLArticle80 } from "../concepts/exceptions-de-l-article-80.ts";
import {
  type DeclarationDeFait,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";

export const exceptionArticle80Usld: DeclarationDeFait = ({ validated }) =>
  regles()
    .retient(ExceptionsDeLArticle80.of(validated).fait("6_USLD"))
    .sinon(PAS_ENCORE_ETABLI);
