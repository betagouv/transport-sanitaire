// fait_autonomie_professionnel : intervention d'un professionnel nécessaire.
//
// Q1.1 le dit : un professionnel intervient, ou le patient s'en passe, seul
// ou avec un proche.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";

export const autonomieProfessionnel = unFait("fait_autonomie_professionnel")
  .ouiSi(given.question("Q1.1").answer().is("3_AVEC_UN_PROFESSIONNEL"))
  .nonSi(given.question("Q1.1").answer().isOneOf("1_SEUL", "2_AVEC_UN_PROCHE"))
  .sinon("Q1.1 n'est pas encore validée.");
