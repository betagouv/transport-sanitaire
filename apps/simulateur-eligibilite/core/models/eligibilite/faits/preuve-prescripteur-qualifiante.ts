// fait_preuve_prescripteur_qualifiante : confirmation de couverture par le
// prescripteur accompagnée de son fondement vérifiable.
//
// Aucune question ne le pose : les sous-questions a à e et i à l de Q2.1, et
// le régime, ne changent aucune sortie. Elles restent masquées (D-102).
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { SOUS_QUESTIONS_MASQUEES } from "../declarations/faits.ts";

export const preuvePrescripteurQualifiante = unFait(
  "fait_preuve_prescripteur_qualifiante",
).sinon(SOUS_QUESTIONS_MASQUEES);
