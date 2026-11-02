// fait_htnm_hors_maternite : segment HTNM hors Engagement maternité.
//
// Q2.1 = 13 décrit un trajet de l'Engagement maternité. Les options 4 et 5 de
// Q2.2.1 s'excluent pour un même trajet (`CONTRAT_CONTEXTES_DECISIFS.md`) :
// il n'est pas un HTNM hors maternité. Sinon, Q2.2.1 le dit.
// Le HTNM se dit hors Engagement maternité dans son libellé même (point 11).
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import { MOTIF, SITUATIONS } from "./communs.ts";

export const htnmHorsMaternite = unFait("fait_htnm_hors_maternite")
  .nonSi(
    SITUATIONS.isPresent().and(MOTIF.is("13_MATERNITE")),
    "Le même trajet n'est pas un HTNM hors maternité.",
  )
  .ouiSi(SITUATIONS.checked("5_HTNM"))
  .nonSiEcartee(SITUATIONS, "5_HTNM")
  .sinon(PAS_ENCORE_ETABLI);
