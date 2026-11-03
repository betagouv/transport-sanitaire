// Le jour : une date bornée, qui dépend du retrait sur la même page.

import { dayFromToday } from "../../../jour.ts";
import { question } from "../../question.ts";

export const JOUR = question
  .date("jour", "Pour quel jour ?")
  .hint(
    "Démontre : une date bornée, d'aujourd'hui à dans sept jours. Une date hors bornes est refusée. Et une réponse qui dépend d'une autre sur la même page : changer de façon de récupérer vide le jour.",
  )
  .boundsFrom(() => ({ min: dayFromToday(0), max: dayFromToday(7) }))
  .dependsOn("retrait");
