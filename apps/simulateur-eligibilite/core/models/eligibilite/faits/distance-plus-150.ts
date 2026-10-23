// fait_distance_plus_150 : trajet aller dépasse 150 km.
//
// Q2.3.1 range le trajet dans une tranche : seule celle de plus de 150 km
// l'établit. 150 km exactement ne dépassent pas le seuil.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { DistanceDuTrajet } from "../concepts/distance-du-trajet.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const distancePlus150: DeclarationDeFait = ({ validated }) =>
  DistanceDuTrajet.of(validated).depasseCentCinquanteKm();
