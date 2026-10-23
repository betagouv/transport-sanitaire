// fait_motif_camsp : soin CAMSP ou CMPP qualifié.
//
// L'autre cadre de Q2.2.1 le dit, coché ou écarté (Q2.2.1.b). Sinon, Q2.1 dit
// le CAMSP, et Q2.1.h dit si la séance est dans le parcours de l'enfant.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { regles } from "../../../socle/index.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";
import { situationDuCadre } from "../p2/contextes.ts";

export const motifCamsp: DeclarationDeFait = ({ validated }) =>
  regles()
    .retient(situationDuCadre(validated, "6_CAMSP"))
    .seulementSi(validated.question("Q2.1").is("10_CAMSP"))
    .selon(validated.question("Q2.1.h"), {
      "1_OUI": "oui",
      "2_NON": "non",
      "3_NE_SAIT_PAS": "inconnu",
    })
    .sinon("Ni Q2.1.h, ni Q2.2.1 n'établissent encore le CAMSP.");
