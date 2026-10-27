// fait_distance_plus_50 : le trajet actuellement évalué dépasse 50 km, la série
// étant qualifiée séparément.
//
// Q2.3.1 range le trajet dans une tranche : plus de 50 km, ou plus de 150 km,
// l'établissent. 50 km exactement ne dépassent pas le seuil.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";

const DISTANCE = given.question("Q2.3.1").answer();

export const distancePlus50 = unFait("fait_distance_plus_50")
  .nonSi(DISTANCE.is("1_CINQUANTE_KM_OU_MOINS"))
  .ouiSi(
    DISTANCE.isOneOf("2_PLUS_DE_CINQUANTE_KM", "3_PLUS_DE_CENT_CINQUANTE_KM"),
  )
  .sinon("Q2.3.1 n'est pas encore validée.");
