// fait_exception_article80_ehpad : EHPAD hors même implantation.
//
// L'option 7 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Sans Q2.6, il reste absent.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { ExceptionsDeLArticle80 } from "../concepts/exceptions-de-l-article-80.ts";
import {
  type DeclarationDeFait,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";

export const exceptionArticle80Ehpad: DeclarationDeFait = ({ validated }) =>
  unFait()
    .retient(ExceptionsDeLArticle80.of(validated).fait("7_EHPAD"))
    .sinon(PAS_ENCORE_ETABLI);
