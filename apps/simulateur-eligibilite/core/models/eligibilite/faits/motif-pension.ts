// fait_motif_pension : soins de pension militaire qualifiés.
//
// L'autre cadre de Q2.2.1 le dit : cochée, la pension militaire (Q2.2.1.b)
// l'établit ; proposée et écartée, elle vaut « non ».
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

export const motifPension = unFait("fait_motif_pension")
  .nonSi(
    AUTRE_CADRE_ECARTE.and(SITUATION_PROPOSEE["9_PENSION_MILITAIRE"]),
    "« autre situation » proposée, non cochée.",
  )
  .ouiSi(SITUATION_DU_CADRE.checked("9_PENSION_MILITAIRE"))
  .nonSiEcartee(SITUATION_DU_CADRE, "9_PENSION_MILITAIRE")
  .sinon(PAS_ENCORE_ETABLI);
