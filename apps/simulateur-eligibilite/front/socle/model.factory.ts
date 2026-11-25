// Vérifie un modèle contre ses propres types (`model.types.ts`), puis le donne
// tel que le socle le voit.

import type { AnyDocuments, AnyFaits } from "../../core/socle/model.types";
import type {
  AnyCibles,
  AnyQuestions,
} from "../../core/socle/questionnaire-engine";
import type { Model } from "./model.types";

/** La fabrique du modèle tel que le socle le voit. */
export class ModelFactory {
  /**
   * Vérifie un modèle contre ses propres types, puis le donne tel que le socle
   * le voit : sans nom de question, de fait, de cible ni de document.
   */
  static define<
    Questions extends AnyQuestions,
    Faits extends AnyFaits,
    Cibles extends AnyCibles,
    FirstReading,
    CerfaReading,
    Documents extends AnyDocuments,
  >(
    model: Model<
      Questions,
      Faits,
      Cibles,
      FirstReading,
      CerfaReading,
      Documents
    >,
  ): Model {
    // Le socle ne lit aucune clé : il redonne au modèle ce que le modèle lui a
    // donné. L'effacement des types est donc sans risque, et il n'a lieu qu'ici.
    return model as unknown as Model;
  }
}
