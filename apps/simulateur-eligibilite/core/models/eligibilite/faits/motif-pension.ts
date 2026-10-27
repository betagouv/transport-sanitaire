// fait_motif_pension : soins de pension militaire qualifiés.
//
// L'autre cadre de Q2.2.1 le dit : cochée, la pension militaire (Q2.2.1.b)
// l'établit ; proposée et écartée, elle vaut « non ».
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { ContextesDuTrajet } from "../concepts/contextes-du-trajet.ts";
import {
  type DeclarationDeFait,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";

export const motifPension: DeclarationDeFait = ({ validated }) =>
  unFait()
    .retient(ContextesDuTrajet.of(validated).situation("9_PENSION_MILITAIRE"))
    .sinon(PAS_ENCORE_ETABLI);
