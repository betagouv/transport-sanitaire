// Vérifie le métier d'un modèle contre ses propres types (`model.types.ts`),
// puis le donne avec ce qu'une question change de ce que lisent ses résultats.

import type {
  AnyDocuments,
  AnyFaits,
  CoreModel,
  CoreModelDeclaration,
} from "./model.types.ts";
import {
  type AnyCibles,
  type AnyQuestions,
  Questionnaire,
  Reads,
  Relevance,
} from "./questionnaire-engine/index.ts";

/** La fabrique du métier d'un modèle. */
export class CoreModelFactory {
  /**
   * Vérifie le métier d'un modèle contre ses propres types, puis y ajoute, avec
   * un graphe de décision, ce qu'une question change de ce que lisent ses
   * résultats : le même parcours à l'écran et sous Node.
   */
  static define<
    Questions extends AnyQuestions,
    Faits extends AnyFaits,
    Cibles extends AnyCibles,
    FirstReading,
    CerfaReading,
    Documents extends AnyDocuments,
    Resultat = unknown,
  >(
    model: CoreModelDeclaration<
      Questions,
      Faits,
      Cibles,
      FirstReading,
      CerfaReading,
      Documents,
      Resultat
    >,
  ): CoreModel<
    Questions,
    Faits,
    Cibles,
    FirstReading,
    CerfaReading,
    Documents,
    Resultat
  > {
    // La pertinence ne lit aucune clé du modèle : elle reçoit ce que le modèle
    // lui a donné. L'effacement des types est donc sans risque, et il n'a lieu
    // qu'ici.
    const untyped = model as unknown as CoreModelDeclaration;
    const { decision } = untyped;
    if (!decision) return model;
    const relevance = new Relevance({
      graph: decision.graph,
      pages: [
        ...Questionnaire.pagesOf(untyped.questionnaire),
        ...untyped.complement.pages,
      ],
      faits: {
        reads: untyped.preconisation.reads,
        imposed: decision.imposed,
        of: decision.faits,
      },
      shown: CoreModelFactory.#shown(untyped),
    });
    return { ...model, relevance };
  }

  // Tout ce que lisent les résultats : le premier, le choix du document, son
  // titre, son texte et son bouton, puis le besoin.
  static #shown({
    result,
    cerfa,
    intent,
  }: Pick<CoreModelDeclaration, "result" | "cerfa" | "intent">): Reads {
    const readings = [
      result.reading,
      cerfa.document,
      cerfa.title,
      cerfa.reading,
      cerfa.startLabel,
      ...(intent ? [intent] : []),
    ];
    return Reads.union(...readings.map((reading) => reading.reads));
  }
}
