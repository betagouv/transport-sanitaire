// fait_htnm_hors_maternite : segment HTNM hors Engagement maternité.
//
// Q2.2.1 le dit. Le HTNM se dit hors Engagement maternité dans son libellé
// même (point 11). Coché avec l'examen ou l'hébergement de la maternité, il
// attend que Q2.14.trajet dise le déplacement évalué : celui de la maternité
// l'écarte (`DEPLACEMENT_EVALUE_EXPLICITE`, TS1018-04). Une maternité cochée
// seule l'écarte, proposé et non coché.
//
// Il suit `CONTRAT_REPONSES_FAITS.json` et `CONTRAT_Q221_PROGRESSIF.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";
import { PAS_ENCORE_ETABLI } from "./noms.ts";

const SITUATIONS = given.question("Q2.2.1").answer();
const UN_HTNM = SITUATIONS.checked("5_HTNM");
const DEPLACEMENT = given.question("Q2.14.trajet").answer();
const UNE_MATERNITE = SITUATIONS.checked("14_EXAMEN_MATERNITE").or(
  SITUATIONS.checked("15_HEBERGEMENT_MATERNITE"),
);

export const htnmHorsMaternite = unFait("fait_htnm_hors_maternite")
  .nonSi(
    DEPLACEMENT.is("1_ENGAGEMENT_MATERNITE"),
    "Le déplacement évalué est celui de l'Engagement maternité.",
  )
  .ouiSi(
    UN_HTNM.and(
      UNE_MATERNITE.not().or(DEPLACEMENT.is("2_HTNM_HORS_MATERNITE")),
    ),
  )
  .inconnuSi(UN_HTNM, "Le déplacement évalué reste à préciser.")
  .nonSiEcartee(SITUATIONS, "5_HTNM")
  .sinon(PAS_ENCORE_ETABLI);
