// fait_htnm_segment_verifie : règle exacte du segment HTNM vérifiée.
//
// Hors Engagement maternité, aucune règle du segment d'un HTNM n'est vérifiée :
// un HTNM coché en Q2.2.1 le met à « non », et la caisse tranche.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { SITUATIONS } from "./communs.ts";
import { PAS_ENCORE_ETABLI } from "./noms.ts";

export const htnmSegmentVerifie = unFait("fait_htnm_segment_verifie")
  .nonSi(
    SITUATIONS.checked("5_HTNM"),
    "Le segment du HTNM hors Engagement n'est pas vérifié.",
  )
  .sinon(PAS_ENCORE_ETABLI);
