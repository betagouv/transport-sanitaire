// Le contexte des conditions et des libellés du moment d'une question : les
// réponses, les questions validées, les cibles et les faits. Les constructeurs
// nommés (`question-factory.ts`) y traduisent les rappels du moteur, qui les
// appelle avec trois paramètres.
//
// Les faits ne se calculent qu'à la lecture, une fois par appel.

import type { GivenAnswers } from "./given-answers";
import type { AnyQuestions } from "./question";
import type { ValidatedAnswers } from "./validated-answers";

/** Ce que lisent les conditions et les libellés du moment d'une question. */
export type QuestionContext<Questions extends AnyQuestions, Cibles, Faits> = {
  readonly answers: GivenAnswers<Questions>;
  readonly validated: ValidatedAnswers<Questions>;
  /** Les cibles figées au verrou. Avant lui : `undefined`. */
  readonly cibles: Cibles;
  /**
   * Les faits des questions validées jusqu'ici. Une garde les lit quand un
   * fait dit déjà ce qu'elle teste. Un fait ne lit jamais une garde.
   */
  readonly faits: Faits;
};

/** Réécrit les rappels d'une déclaration dans la forme du moteur. */
export type Adapt = (declared: object) => object;

/** Ce qui réécrit les rappels d'un modèle, d'après le calcul de ses faits. */
export function adapterOf<Questions extends AnyQuestions, Faits>(
  faitsOf: (
    answers: GivenAnswers<Questions>,
    validated: ValidatedAnswers<Questions>,
  ) => Faits,
): Adapt {
  return adapter(contexts(faitsOf));
}

// ---- implémentation ----

// Les rappels que le moteur appelle avec les réponses, les cibles et les
// questions validées.
const CALLBACKS: ReadonlySet<string> = new Set([
  "labelFrom",
  "reminderFrom",
  "askedIf",
  "inconsistenciesFrom",
  "boundsFrom",
  "abroadIf",
  "offeredIf",
  "helpFrom",
]);

type ContextOf = (
  answers: unknown,
  cibles: unknown,
  validated: unknown,
) => unknown;

// Réécrit les rappels d'une déclaration dans la forme du moteur.
function adapter(contextOf: ContextOf): Adapt {
  return (declared) =>
    Object.fromEntries(
      Object.entries(declared).map(([key, value]) => [
        key,
        CALLBACKS.has(key) && typeof value === "function"
          ? (answers: unknown, cibles: unknown, validated: unknown) =>
              value(contextOf(answers, cibles, validated))
          : value,
      ]),
    );
}

// Le contexte de chaque appel. Les faits ne se calculent qu'à la lecture, une
// fois par appel. Un calcul qui en relance un autre boucle : il s'arrête net.
function contexts<Questions extends AnyQuestions, Faits>(
  faitsOf: (
    answers: GivenAnswers<Questions>,
    validated: ValidatedAnswers<Questions>,
  ) => Faits,
): ContextOf {
  let computing = false;
  const compute = (answers: unknown, validated: unknown): Faits => {
    if (computing)
      throw new Error(
        "Les faits se calculent déjà : un fait ne lit jamais une garde qui lit les faits.",
      );
    computing = true;
    try {
      return faitsOf(
        answers as GivenAnswers<Questions>,
        validated as ValidatedAnswers<Questions>,
      );
    } finally {
      computing = false;
    }
  };
  return (answers, cibles, validated) => {
    let read: { readonly faits: Faits } | undefined;
    return {
      answers,
      cibles,
      validated,
      get faits() {
        read ??= { faits: compute(answers, validated) };
        return read.faits;
      },
    };
  };
}
