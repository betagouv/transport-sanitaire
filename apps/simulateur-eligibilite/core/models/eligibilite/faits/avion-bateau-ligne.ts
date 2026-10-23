// fait_avion_bateau_ligne : avion ou bateau de ligne régulière.
//
// Q2.3.2 est une case seule : cochée, elle l'établit ; décochée sur la page
// validée, elle vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { regles } from "../../../socle/index.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const avionBateauLigne: DeclarationDeFait = ({ validated }) => {
  const caseSeule = validated.question("Q2.3.2");
  return regles()
    .ouiSi(caseSeule.is(true), "Q2.3.2 : case cochée.")
    .nonSi(caseSeule.is(false), "Q2.3.2 : case décochée.")
    .sinon("Q2.3.2 n'est pas encore validée.");
};
