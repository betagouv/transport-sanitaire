// Établir la préconisation de réponses, sans parcours : l'écran des seeds et
// les tests du modèle la demandent sur des réponses données d'un coup.

import type { AnyFaits, CoreModel } from "../model.ts";
import type {
  Answers,
  AnyCibles,
  AnyQuestions,
} from "../questionnaire-engine/index.ts";
import { PreconisationService } from "./preconisation.service.ts";
import type { Preconisation } from "./preconisation.vo.ts";

export class EstablishAPreconisation<
  Questions extends AnyQuestions = AnyQuestions,
  Faits extends AnyFaits = AnyFaits,
  Cibles extends AnyCibles = AnyCibles,
> {
  readonly #preconisation: PreconisationService<Questions, Faits, Cibles>;

  constructor(model: CoreModel<Questions, Faits, Cibles>) {
    this.#preconisation = new PreconisationService(model);
  }

  /** La préconisation de ces réponses, lues dans les parties d'avant le verrou. */
  execute(answers: Answers<Questions>): Preconisation<Faits, Cibles> {
    return this.#preconisation.ofAnswers(answers);
  }
}
