// fait_appel_centre15 : appel effectif au SAMU-Centre 15.
//
// L'option 3 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Non proposée, il reste absent.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { ExceptionsDeLArticle80 } from "../concepts/exceptions-de-l-article-80.ts";
import {
  type DeclarationDeFait,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";

export const appelCentre15: DeclarationDeFait = ({ validated }) =>
  unFait()
    .retient(ExceptionsDeLArticle80.of(validated).centre15())
    .sinon(PAS_ENCORE_ETABLI);
