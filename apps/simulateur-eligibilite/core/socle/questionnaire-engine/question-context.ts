// Le contexte des rappels d'une question : les réponses, les questions
// validées, les cibles et les faits. Toutes ses conditions et tous ses libellés
// du moment le reçoivent, et rien d'autre.
//
// Les faits ne se calculent qu'à la lecture, une fois par contexte.

import type { GivenAnswers } from "./given-answers.ts";
import type { AnyCibles, AnyQuestions } from "./question.ts";
import type { ValidatedAnswers } from "./validated-answers.ts";

/** Ce que lisent les conditions et les libellés du moment d'une question. */
export type QuestionContext<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
  Faits = unknown,
> = {
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

/**
 * Ce qu'une question voit des réponses, sans ses faits : elle les en déduit
 * par le calcul de son modèle.
 */
export type SeenAnswers<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> = Omit<QuestionContext<Questions, Cibles>, "faits">;

/** Ce qui calcule les faits que lisent les rappels des questions d'un modèle. */
export type FaitsOf<
  Questions extends AnyQuestions = AnyQuestions,
  Faits = unknown,
> = (
  answers: GivenAnswers<Questions>,
  validated: ValidatedAnswers<Questions>,
) => Faits;

/**
 * Le contexte d'une question. `faitsOf` : le calcul des faits que sa
 * déclaration lui donne. Absent, les faits ne se lisent pas.
 */
export function contextOf<Questions extends AnyQuestions, Cibles, Faits>(
  seen: SeenAnswers<Questions, Cibles>,
  faitsOf: FaitsOf<Questions, Faits> | undefined,
): QuestionContext<Questions, Cibles, Faits> {
  let read: { readonly faits: Faits } | undefined;
  return {
    answers: seen.answers,
    validated: seen.validated,
    cibles: seen.cibles,
    get faits() {
      read ??= { faits: computed(faitsOf, seen) };
      return read.faits;
    },
  };
}

// ---- implémentation ----

// Un calcul des faits en cours. Un calcul qui en relance un autre boucle : un
// fait a lu une garde qui lit les faits. Il s'arrête net.
let computing = false;

function computed<Questions extends AnyQuestions, Faits>(
  faitsOf: FaitsOf<Questions, Faits> | undefined,
  { answers, validated }: Omit<QuestionContext<Questions>, "faits" | "cibles">,
): Faits {
  if (!faitsOf)
    throw new Error(
      "Cette question ne connaît pas ses faits : déclare-la par les constructeurs de son modèle.",
    );
  if (computing)
    throw new Error(
      "Les faits se calculent déjà : un fait ne lit jamais une garde qui lit les faits.",
    );
  computing = true;
  try {
    return faitsOf(answers, validated);
  } finally {
    computing = false;
  }
}
