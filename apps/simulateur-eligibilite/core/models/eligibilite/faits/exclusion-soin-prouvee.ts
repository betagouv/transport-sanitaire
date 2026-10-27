// fait_exclusion_soin_prouvee : exclusion du soin prouvée par une source,
// décisive seulement si la prestation conditionne ce transport.
//
// Aucune question ne le pose : les sous-questions a à e et i à l de Q2.1, et
// le régime, ne changent aucune sortie. Elles restent masquées (D-102).
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { SOUS_QUESTIONS_MASQUEES } from "../declarations/faits.ts";

export const exclusionSoinProuvee = unFait("fait_exclusion_soin_prouvee").sinon(
  SOUS_QUESTIONS_MASQUEES,
);
