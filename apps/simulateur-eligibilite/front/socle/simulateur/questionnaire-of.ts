// Le questionnaire d'un modèle, tel que le parcours le lit : ses pages, et ce
// qu'une question change de ce qui compte (#255).

import {
  type Page,
  pagesOf,
} from "../../../core/socle/questionnaire-engine/question";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";
import type { Model } from "../model";

/** Ces pages du modèle, d'avant le verrou si rien ne les nomme. */
export function questionnaireOf(
  model: Model,
  pages: readonly Page[] = pagesOf(model.core.questionnaire),
): Questionnaire {
  return new Questionnaire(pages, model.core.relevance);
}
