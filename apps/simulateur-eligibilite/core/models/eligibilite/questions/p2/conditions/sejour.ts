// Le cadre du séjour en cours, « déjà hospitalisé » coché : un établissement de
// santé ou une Hospitalisation à Domicile (TS1014-B01). Une sortie
// d'établissement (Q2.1.g) dit déjà l'établissement : le cadre ne se demande
// pas alors (Q2.2.1.cadre).

import { given } from "../../question.ts";
import { Q2_1_G } from "../questions/q2-1.ts";
import { Q2_2_1 } from "../questions/q2-2-1.ts";
import { Q2_2_1_CADRE } from "../questions/q2-2-1-cadre.ts";

const unSejourCoche = given
  .question(Q2_2_1)
  .answer()
  .checked("1_HOSPITALISATION");
const uneSortie = given.question(Q2_1_G).answer().is("2_SORTIE");
const cadre = given.question(Q2_2_1_CADRE).answer();

/** Le séjour coché a lieu en Hospitalisation à Domicile. */
export const unSejourEnHad = unSejourCoche.and(cadre.is("2_HAD"));

/** Le séjour coché a lieu dans un établissement de santé. */
export const unSejourEnEtablissement = unSejourCoche.and(
  cadre.is("1_ETABLISSEMENT").or(uneSortie),
);
