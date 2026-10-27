// Le contexte des rappels d'une question : les réponses, les questions
// validées, les faits et les cibles. Toutes ses conditions et tous ses
// libellés du moment le reçoivent, et rien d'autre.
//
// Il est le bout du chemin d'une réponse : réponses → validées → faits →
// cibles. Le moteur fait les deux premières étapes, dans l'ordre des questions
// (`reading-in-order.ts`). Le modèle fait les deux dernières, par son
// `Pipeline`. Faits et cibles ne se calculent qu'à la lecture, une fois par
// contexte. Le catalogue des faits arrête un fait qui se relit par une garde.

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
  /**
   * Les faits des questions validées jusqu'ici. Une garde les lit quand un
   * fait dit déjà ce qu'elle teste.
   */
  readonly faits: Faits;
  /**
   * Les cibles calculées sur ces faits. Sur une page posée après le verrou :
   * celles figées au verrou. Une garde les lit quand une règle de l'éditeur
   * dit déjà ce qu'elle teste.
   */
  readonly cibles: Cibles;
};

/**
 * Ce qu'une question voit des réponses, avant les étapes du modèle. `cibles` :
 * celles figées au verrou, sur une page posée après lui. Ailleurs :
 * `undefined`.
 */
export type SeenAnswers<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> = Omit<QuestionContext<Questions, Cibles>, "faits">;

/** Ce qui calcule les faits que lisent les rappels des questions d'un modèle. */
type FaitsOf<Questions extends AnyQuestions = AnyQuestions, Faits = unknown> = (
  answers: GivenAnswers<Questions>,
  validated: ValidatedAnswers<Questions>,
) => Faits;

/** Ce qui calcule les cibles d'un modèle sur ses faits : ses règles. */
type CiblesOf<Faits = unknown, Cibles = unknown> = (faits: Faits) => Cibles;

/**
 * Les étapes que le modèle ajoute au chemin d'une réponse : des réponses
 * validées aux faits, puis des faits aux cibles. Ce sont celles de sa
 * préconisation, sans la complétude qu'elle seule impose.
 */
export type Pipeline<Questions extends AnyQuestions, Faits, Cibles> = {
  readonly faits?: FaitsOf<Questions, Faits>;
  readonly cibles?: CiblesOf<Faits, Cibles>;
};

/** Le contexte d'une question : ce qu'elle voit, passé par le `pipeline`. */
export function contextOf<Questions extends AnyQuestions, Cibles, Faits>(
  seen: SeenAnswers<Questions, Cibles | undefined>,
  pipeline: Pipeline<Questions, Faits, Cibles>,
): QuestionContext<Questions, Cibles, Faits> {
  const faits = once(() => faitsThrough(pipeline, seen));
  const cibles = once(() => ciblesThrough(pipeline, seen, faits));
  return {
    answers: seen.answers,
    validated: seen.validated,
    get faits() {
      return faits();
    },
    get cibles() {
      return cibles();
    },
  };
}

// ---- implémentation ----

// Étape 3 : des réponses validées aux faits.
function faitsThrough<Questions extends AnyQuestions, Faits>(
  { faits }: Pipeline<Questions, Faits, unknown>,
  { answers, validated }: SeenAnswers<Questions, unknown>,
): Faits {
  if (!faits)
    throw new Error(
      "Cette question ne connaît pas ses faits : déclare-la par les constructeurs de son modèle.",
    );
  return faits(answers, validated);
}

// Étape 4 : des faits aux cibles, sauf si le verrou les a figées. Un modèle
// sans règles laisse les cibles telles que le verrou les donne.
function ciblesThrough<Questions extends AnyQuestions, Faits, Cibles>(
  { cibles }: Pipeline<Questions, Faits, Cibles>,
  seen: SeenAnswers<Questions, Cibles | undefined>,
  faits: () => Faits,
): Cibles {
  if (seen.cibles !== undefined || !cibles) return seen.cibles as Cibles;
  return cibles(faits());
}

// Une valeur calculée à sa première lecture, puis gardée.
function once<Value>(compute: () => Value): () => Value {
  let read: { readonly value: Value } | undefined;
  return () => {
    read ??= { value: compute() };
    return read.value;
  };
}
