// Q3.5 : la précision de l'urgence, seulement si les règles l'ont retenue,
// hors appel au Centre 15 (`cible_urgence_autre`). Elle ne se repose pas, et
// sa précision ne change rien à l'issue. La référence du Centre 15 ne se
// demande pas : un appel au Centre 15 entre établissements va toujours à la
// caisse, sans document à compléter.

import { given, question } from "../../question.ts";
import { pmtOuDap } from "../conditions/supports-du-complement.ts";

// `cible_urgence_autre` manque tant que l'appel au Centre 15 n'est pas un fait :
// l'urgence attestée suffit alors, puisque l'appel n'est pas établi.
const autre = given.cible("cible_urgence_autre");
const uneAutreUrgence = autre
  .isOui()
  .or(
    autre
      .isInconnue()
      .or(autre.isSansObjet())
      .and(given.cible("cible_urgence_attestee").isOui())
      .and(given.cible("cible_urgence_appel15").isOui().not()),
  );

export const Q3_5 = question
  .longText(
    "Q3.5",
    "Quelle précision faut-il apporter sur l’urgence déjà attestée ?",
  )
  .hint("La nature de l’urgence médicale attestée.")
  .mattersWhile(pmtOuDap.and(uneAutreUrgence));
