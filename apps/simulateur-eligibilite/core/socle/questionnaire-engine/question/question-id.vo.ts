// L'id d'une question, qu'on la désigne par son objet ou par son id. Le moteur
// range les réponses par id : ce qui accepte les deux formes passe par ici.
//
//   QuestionId.of(Q2_10).value    // "Q2.10"
//   QuestionId.of("Q2.10").value  // "Q2.10"

import type { Answered } from "./question.types.ts";

/** L'id d'une question. Il ne change pas, et deux ids égaux se valent. */
export class QuestionId {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
    Object.freeze(this);
  }

  /** L'id de la question que désigne `question`. */
  static of(question: string | Answered): QuestionId {
    return new QuestionId(
      typeof question === "string" ? question : question.id,
    );
  }

  equals(other: QuestionId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
