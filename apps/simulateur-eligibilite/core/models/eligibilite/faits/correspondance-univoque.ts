// fait_correspondance_univoque : correspondance du libellé univoque.
//
// Aucune question ne le pose : les sous-questions a à e et i à l de Q2.1, et
// le régime, ne changent aucune sortie. Elles restent masquées (D-102).
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { SOUS_QUESTIONS_MASQUEES } from "../declarations/faits.ts";

export const correspondanceUnivoque = unFait(
  "fait_correspondance_univoque",
).sinon(SOUS_QUESTIONS_MASQUEES);
