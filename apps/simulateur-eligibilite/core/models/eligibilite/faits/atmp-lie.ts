// fait_atmp_lie : AT ou MP en lien direct.
//
// Le second bloc de Q2.2.1 le dit : cochés, l'AT ou la MP (Q2.2.1.b)
// l'établissent ; proposés et écartés, ils valent « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import { SOINS } from "./communs.ts";

export const atmpLie = unFait("fait_atmp_lie")
  .ouiSi(SOINS.checked("1_ATMP"))
  .nonSiEcartee(SOINS, "1_ATMP")
  .sinon(PAS_ENCORE_ETABLI);
