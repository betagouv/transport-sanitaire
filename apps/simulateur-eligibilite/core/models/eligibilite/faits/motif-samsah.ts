// fait_motif_samsah : soins SAMSAH qualifiés.
//
// Le second bloc de Q2.2.1 le dit : coché, le SAMSAH (Q2.2.1.b) l'établit ;
// proposé et écarté, il vaut « non ».
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";
import { PAS_ENCORE_ETABLI } from "./noms.ts";

export const motifSamsah = unFait("fait_motif_samsah")
  .ouiSi(given.question("Q2.2.1.b").answer().checked("7_SAMSAH"))
  .nonSiEcartee(given.question("Q2.2.1.b").answer(), "7_SAMSAH")
  .sinon(PAS_ENCORE_ETABLI);
