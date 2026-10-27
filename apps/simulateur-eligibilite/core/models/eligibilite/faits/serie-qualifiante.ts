// fait_serie_qualifiante : au moins quatre transports de plus de 50 km chacun
// au titre du même traitement, dans les deux mois du premier.
//
// Q2.3.3 porte sur la conjonction entière : « Non » ne dit pas quelle
// condition manque. Elle ne se pose pas sous 50 km (Q2.3.1) : la série reste
// alors absente, et les règles l'écartent par la distance.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { DistanceDuTrajet } from "../concepts/distance-du-trajet.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const serieQualifiante: DeclarationDeFait = ({ validated }) =>
  unFait()
    .selon(validated.question("Q2.3.3"), { "1_OUI": "oui", "2_NON": "non" })
    .sinon(
      DistanceDuTrajet.of(validated).estDeCinquanteKmOuMoins()
        ? "Q2.3.3 ne se pose pas : le trajet ne dépasse pas 50 km."
        : "Q2.3.3 n'est pas encore validée.",
    );
