// fait_preuve_prestation_absente : après recherche, ni preuve automatique
// positive ni preuve du prescripteur.
//
// Aucune question ne le pose : les sous-questions a à e et i à l de Q2.1, et
// le régime, ne changent aucune sortie. Elles restent masquées (D-102).
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { SOUS_QUESTIONS_MASQUEES } from "../declarations/faits.ts";

export const preuvePrestationAbsente = unFait(
  "fait_preuve_prestation_absente",
).sinon(SOUS_QUESTIONS_MASQUEES);
