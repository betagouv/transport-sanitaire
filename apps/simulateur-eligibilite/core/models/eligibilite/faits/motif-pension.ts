// fait_motif_pension : soins de pension militaire qualifiés.
//
// Le second bloc de Q2.2.1 le dit : cochée, la pension militaire (Q2.2.1.b)
// l'établit ; proposée et écartée, elle vaut « non ».
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import { SOINS } from "./communs.ts";

export const motifPension = unFait("fait_motif_pension")
  .ouiSi(SOINS.checked("9_PENSION_MILITAIRE"))
  .nonSiEcartee(SOINS, "9_PENSION_MILITAIRE")
  .sinon(PAS_ENCORE_ETABLI);
