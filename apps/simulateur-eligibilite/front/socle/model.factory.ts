// Vérifie un modèle contre ses propres types (`model.types.ts`), puis le donne
// tel que le socle le voit.

import type { AnyFaits } from "../../core/socle/model.types";
import {
  type AnyCibles,
  type AnyQuestions,
  Questionnaire,
  Reads,
  Relevance,
} from "../../core/socle/questionnaire-engine";
import type { Model } from "./model.types";

/** La fabrique du modèle tel que le socle le voit. */
export class ModelFactory {
  /**
   * Vérifie un modèle contre ses propres types, puis le donne tel que le socle
   * le voit : sans nom de question, de fait ni de cible. Avec un graphe de
   * décision, il y ajoute ce qu'une question change de ce que lisent ses
   * résultats.
   */
  static define<
    Questions extends AnyQuestions,
    Faits extends AnyFaits,
    Cibles extends AnyCibles,
    FirstReading,
    CerfaReading,
  >(model: Model<Questions, Faits, Cibles, FirstReading, CerfaReading>): Model {
    // Le socle ne lit aucune clé : il redonne au modèle ce que le modèle lui a
    // donné. L'effacement des types est donc sans risque, et il n'a lieu qu'ici.
    return ModelFactory.#withRelevance(model as unknown as Model);
  }

  static #withRelevance(model: Model): Model {
    const { core, result, cerfa } = model;
    if (!core.decision) return model;
    const values = [result.reading, cerfa.form, cerfa.title, cerfa.reading]
      .concat(cerfa.startLabel, model.intent ?? [])
      .map((value) => value.reads);
    const shown = Reads.union(...values);
    const relevance = new Relevance({
      graph: core.decision.graph,
      pages: [
        ...Questionnaire.pagesOf(core.questionnaire),
        ...core.complement.pages,
      ],
      faits: {
        reads: core.preconisation.reads,
        imposed: core.decision.imposed,
        of: core.decision.faits,
      },
      shown,
    });
    return { ...model, core: { ...core, relevance } };
  }
}
