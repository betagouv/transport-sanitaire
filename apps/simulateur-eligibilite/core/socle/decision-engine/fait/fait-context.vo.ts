// Le contexte d'un fait : ce qu'il voit pour se calculer. Les questions
// validées et les autres faits. Il ne lit ni cible ni jour : les règles
// calculent les cibles sur les faits, pas l'inverse.

import type {
  Context,
  LocalDateTime,
  ValidatedAnswer,
  ValidatedAnswers,
} from "../../questionnaire-engine/index.ts";

/** Le contexte où se lit un fait. */
export class FaitContext implements Context {
  readonly #validated: ValidatedAnswers;
  readonly #faits: object;

  /** `faits` : les faits du modèle, chacun calculé à sa lecture. */
  constructor(validated: ValidatedAnswers, faits: object) {
    this.#validated = validated;
    this.#faits = faits;
    Object.freeze(this);
  }

  /** La réponse validée de cette question. */
  answer(id: string): ValidatedAnswer {
    return this.#validated.reading()(id);
  }

  fait(nom: string): unknown {
    return (this.#faits as Readonly<Record<string, unknown>>)[nom];
  }

  cible(): never {
    throw new Error("Un fait ne lit pas de cible.");
  }

  cibleAssuming(): never {
    throw new Error("Un fait ne lit pas de cible.");
  }

  today(): LocalDateTime {
    throw new Error("Un fait ne lit pas le jour.");
  }
}
