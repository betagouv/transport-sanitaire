// Le contexte d'un résultat, R2 ou R3 : ce que lisent ses textes et le choix
// de son document. Les questions validées, comme dans un fait, puis les faits
// et les cibles de la préconisation, tels qu'ils sont : rien ne s'y suppose.

import {
  type Context,
  LocalDateTime,
  type ValidatedAnswer,
  type ValidatedAnswers,
} from "../questionnaire-engine/index.ts";

/** Ce qu'un résultat sait : ses réponses, sa préconisation, son jour. */
export type ResultSources = {
  readonly validated: ValidatedAnswers;
  readonly faits: unknown;
  readonly cibles: unknown;
  /** L'instant du résultat : sa date de complétion, ou maintenant. */
  readonly on: Date;
};

/** Le contexte où se lit un résultat. */
export class ResultContext implements Context {
  readonly #sources: ResultSources;

  constructor(sources: ResultSources) {
    this.#sources = sources;
    Object.freeze(this);
  }

  /** La réponse validée de cette question. */
  answer(id: string): ValidatedAnswer {
    return this.#sources.validated.reading()(id);
  }

  fait(nom: string): unknown {
    return named(this.#sources.faits, nom);
  }

  cible(nom: string): unknown {
    return named(this.#sources.cibles, nom);
  }

  cibleAssuming(nom: string): never {
    throw new Error(
      `Un résultat ne suppose rien : il lit ${nom} telle quelle.`,
    );
  }

  /** Le jour du résultat, à Paris. */
  today(): LocalDateTime {
    return LocalDateTime.dayInParis(this.#sources.on);
  }
}

function named(values: unknown, nom: string): unknown {
  return (values as Readonly<Record<string, unknown>>)[nom];
}
