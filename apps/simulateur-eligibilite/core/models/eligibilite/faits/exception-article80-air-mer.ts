// fait_exception_article80_air_mer : segment aérien ou maritime relevant de
// l'exception.
//
// L'option 4 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Sans Q2.6, il reste absent.
// Elle ne se propose pas quand Q2.3.2 dit déjà une ligne régulière : il vaut
// alors « oui ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { regles } from "../../../socle/index.ts";
import { ExceptionsDeLArticle80 } from "../concepts/exceptions-de-l-article-80.ts";
import {
  type DeclarationDeFait,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";

export const exceptionArticle80AirMer: DeclarationDeFait = ({ validated }) =>
  regles()
    .retient(ExceptionsDeLArticle80.of(validated).fait("4_AIR_MER"))
    .sinon(PAS_ENCORE_ETABLI);
