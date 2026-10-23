// fait_exception_article80_radiotherapie : transfert provisoire pour
// radiothérapie en libéral ou centre de santé.
//
// L'option 8 de Q2.6 le dit, une fois Q2.6 validée : cochée, elle l'établit ;
// proposée et écartée, elle vaut « non ». Sans Q2.6, il reste absent.
// Elle ne se propose que pour un transfert provisoire ou un autre
// déplacement : sinon, il vaut « non », avec sa raison.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { regles } from "../../../socle/index.ts";
import { ExceptionsDeLArticle80 } from "../concepts/exceptions-de-l-article-80.ts";
import {
  type DeclarationDeFait,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";

export const exceptionArticle80Radiotherapie: DeclarationDeFait = ({
  validated,
}) =>
  regles()
    .retient(ExceptionsDeLArticle80.of(validated).fait("8_RADIOTHERAPIE"))
    .sinon(PAS_ENCORE_ETABLI);
