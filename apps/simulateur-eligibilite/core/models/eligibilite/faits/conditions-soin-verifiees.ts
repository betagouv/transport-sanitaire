// fait_conditions_soin_verifiees : toutes les conditions de la prestation
// vérifiées.
//
// Aucune question ne le pose : les sous-questions a à e et i à l de Q2.1, et
// le régime, ne changent aucune sortie. Elles restent masquées (D-102).
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { SOUS_QUESTIONS_MASQUEES } from "../declarations/faits.ts";

export const conditionsSoinVerifiees = unFait(
  "fait_conditions_soin_verifiees",
).sinon(SOUS_QUESTIONS_MASQUEES);
