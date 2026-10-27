// fait_distance_plus_150 : trajet aller dépasse 150 km.
//
// Q2.3.1 range le trajet dans une tranche : seule celle de plus de 150 km
// l'établit. 150 km exactement ne dépassent pas le seuil.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";

const DISTANCE = given.question("Q2.3.1").answer();

export const distancePlus150 = unFait("fait_distance_plus_150")
  .nonSi(DISTANCE.isOneOf("1_CINQUANTE_KM_OU_MOINS", "2_PLUS_DE_CINQUANTE_KM"))
  .ouiSi(DISTANCE.is("3_PLUS_DE_CENT_CINQUANTE_KM"))
  .sinon("Q2.3.1 n'est pas encore validée.");
