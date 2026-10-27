// fait_motif_samsah : soins SAMSAH qualifiés.
//
// L'autre cadre de Q2.2.1 le dit : coché, le SAMSAH (Q2.2.1.b) l'établit ;
// proposé et écarté, il vaut « non ».
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { ContextesDuTrajet } from "../concepts/contextes-du-trajet.ts";
import {
  type DeclarationDeFait,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";

export const motifSamsah: DeclarationDeFait = ({ validated }) =>
  unFait()
    .retient(ContextesDuTrajet.of(validated).situation("7_SAMSAH"))
    .sinon(PAS_ENCORE_ETABLI);
