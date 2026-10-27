// fait_atmp_lie : AT ou MP en lien direct.
//
// L'autre cadre de Q2.2.1 le dit : coché, l'AT ou la MP (Q2.2.1.b) l'établit ;
// proposé et écarté, il vaut « non ».
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { ContextesDuTrajet } from "../concepts/contextes-du-trajet.ts";
import {
  type DeclarationDeFait,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";

export const atmpLie: DeclarationDeFait = ({ validated }) =>
  unFait()
    .retient(ContextesDuTrajet.of(validated).situation("1_ATMP"))
    .sinon(PAS_ENCORE_ETABLI);
