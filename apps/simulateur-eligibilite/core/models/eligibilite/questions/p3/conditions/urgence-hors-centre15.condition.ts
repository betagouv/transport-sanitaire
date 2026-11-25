// L'urgence attestée hors appel au Centre 15 : celle que Q3.5 précise, et que
// le cerfa coche en « autres ». Les cibles sont celles de l'issue, figées au
// verrou.

import { given } from "../../question.ts";

const autre = given.cible("cible_urgence_autre");

/**
 * Les règles l'ont retenue (`cible_urgence_autre`). Cette cible manque tant
 * que l'appel au Centre 15 n'est pas un fait : l'urgence attestée suffit
 * alors, puisque l'appel n'est pas établi.
 */
export const uneUrgenceHorsCentre15 = autre
  .isOui()
  .or(
    autre
      .isInconnue()
      .or(autre.isSansObjet())
      .and(given.cible("cible_urgence_attestee").isOui())
      .and(given.cible("cible_urgence_appel15").isOui().not()),
  );
