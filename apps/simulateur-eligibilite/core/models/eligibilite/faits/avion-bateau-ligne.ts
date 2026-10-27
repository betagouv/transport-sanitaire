// fait_avion_bateau_ligne : avion ou bateau de ligne régulière.
//
// Q2.3.2 est une case seule : cochée, elle l'établit ; décochée sur la page
// validée, elle vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";

const LIGNE_REGULIERE = given.question("Q2.3.2").answer();

export const avionBateauLigne = unFait("fait_avion_bateau_ligne")
  .ouiSi(LIGNE_REGULIERE.is(true))
  .nonSi(LIGNE_REGULIERE.is(false))
  .sinon("Q2.3.2 n'est pas encore validée.");
