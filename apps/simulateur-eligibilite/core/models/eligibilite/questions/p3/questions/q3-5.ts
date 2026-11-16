// Q3.5 : la précision de l'urgence, seulement si les règles l'ont retenue,
// hors appel au Centre 15 (`cible_urgence_autre`). Elle ne se repose pas, et
// sa précision ne change rien à l'issue. La référence du Centre 15 ne se
// demande pas : un appel au Centre 15 entre établissements va toujours à la
// caisse, sans document à compléter.

import { question } from "../../question.ts";
import { pmtOuDap } from "../conditions/supports-du-complement.ts";
import { uneUrgenceHorsCentre15 } from "../conditions/urgence-hors-centre15.ts";

export const Q3_5 = question
  .longText(
    "Q3.5",
    "Quelle précision faut-il apporter sur l’urgence déjà attestée ?",
  )
  .hint("La nature de l’urgence médicale attestée.")
  .mattersWhile(pmtOuDap.and(uneUrgenceHorsCentre15));
