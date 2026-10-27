// fait_atmp_lie : AT ou MP en lien direct.
//
// L'autre cadre de Q2.2.1 le dit : coché, l'AT ou la MP (Q2.2.1.b) l'établit ;
// proposé et écarté, il vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import {
  AUTRE_CADRE_ECARTE,
  SITUATION_DU_CADRE,
  SITUATION_PROPOSEE,
} from "./communs.ts";

export const atmpLie = unFait("fait_atmp_lie")
  .nonSi(
    AUTRE_CADRE_ECARTE.and(SITUATION_PROPOSEE["1_ATMP"]),
    "« autre situation » proposée, non cochée.",
  )
  .ouiSi(SITUATION_DU_CADRE.checked("1_ATMP"))
  .nonSiEcartee(SITUATION_DU_CADRE, "1_ATMP")
  .sinon(PAS_ENCORE_ETABLI);
