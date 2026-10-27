// fait_motif_samsah : soins SAMSAH qualifiés.
//
// L'autre cadre de Q2.2.1 le dit : coché, le SAMSAH (Q2.2.1.b) l'établit ;
// proposé et écarté, il vaut « non ».
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import {
  AUTRE_CADRE_ECARTE,
  SITUATION_DU_CADRE,
  SITUATION_PROPOSEE,
} from "./communs.ts";

export const motifSamsah = unFait("fait_motif_samsah")
  .nonSi(
    AUTRE_CADRE_ECARTE.and(SITUATION_PROPOSEE["7_SAMSAH"]),
    "« autre situation » proposée, non cochée.",
  )
  .ouiSi(SITUATION_DU_CADRE.checked("7_SAMSAH"))
  .nonSiEcartee(SITUATION_DU_CADRE, "7_SAMSAH")
  .sinon(PAS_ENCORE_ETABLI);
