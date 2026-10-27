// fait_htnm_hors_maternite : segment HTNM hors Engagement maternité.
//
// Q2.1 = 13 décrit un trajet de l'Engagement maternité. Les options 4 et 5 de
// Q2.2.1.b s'excluent pour un même trajet (`CONTRAT_CONTEXTES_DECISIFS.md`) :
// il n'est pas un HTNM hors maternité. Sinon, l'autre cadre de Q2.2.1 le dit.
// Le HTNM se dit hors Engagement maternité dans son libellé même (point 11).
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import {
  AUTRE_CADRE_ECARTE,
  MOTIF,
  SITUATION_DU_CADRE,
  SITUATION_PROPOSEE,
  SITUATIONS,
} from "./communs.ts";

export const htnmHorsMaternite = unFait("fait_htnm_hors_maternite")
  .nonSi(
    SITUATIONS.isPresent().and(MOTIF.is("13_MATERNITE")),
    "Le même trajet n'est pas un HTNM hors maternité.",
  )
  .nonSi(
    AUTRE_CADRE_ECARTE.and(SITUATION_PROPOSEE["5_HTNM"]),
    "« autre situation » proposée, non cochée.",
  )
  .ouiSi(SITUATION_DU_CADRE.checked("5_HTNM"))
  .nonSiEcartee(SITUATION_DU_CADRE, "5_HTNM")
  .sinon(PAS_ENCORE_ETABLI);
