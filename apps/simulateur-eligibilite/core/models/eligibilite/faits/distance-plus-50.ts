// fait_distance_plus_50 : le trajet actuellement évalué dépasse 50 km, la série
// étant qualifiée séparément.
//
// Q2.3.1 range le trajet dans une tranche : plus de 50 km, ou plus de 150 km,
// l'établissent. 50 km exactement ne dépassent pas le seuil.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { DistanceDuTrajet } from "../concepts/distance-du-trajet.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const distancePlus50: DeclarationDeFait = ({ validated }) =>
  DistanceDuTrajet.of(validated).depasseCinquanteKm();
