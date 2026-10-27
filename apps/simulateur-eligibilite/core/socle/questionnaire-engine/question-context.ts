// Le contexte des rappels d'une question : les réponses, les questions
// validées, les faits et les cibles. Toutes ses conditions et tous ses
// libellés du moment le reçoivent, et rien d'autre.
//
// Il est le bout du chemin d'une réponse : réponses → validées → faits →
// cibles. Le moteur fait les deux premières étapes, dans l'ordre des questions
// (`reading-in-order.ts`). Le modèle fait les deux dernières, par son
// `Pipeline` : son catalogue des faits, puis ses règles. Faits et cibles ne se calculent qu'à la lecture, une fois par
// contexte. Le catalogue des faits arrête un fait qui se relit par une garde.

import { Fait } from "../decision-engine/fait.ts";
import type { FaitCatalogue } from "../decision-engine/fait-catalogue.ts";
import type { AnswerReading } from "./answer-readings.ts";
import type { Reading } from "./condition.ts";
import type { GivenAnswers } from "./given-answers.ts";
import { LocalDateTime } from "./local-date-time.ts";
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
 * `undefined`. `answer` : la réponse d'une question telle que ses conditions
 * la lisent, à sa place (`answer-readings.ts`).
 */
export type SeenAnswers<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> = Omit<QuestionContext<Questions, Cibles>, "faits"> & {
  readonly answer: AnswerReading;
};

/** Ce qui calcule les cibles d'un modèle sur ses faits : ses règles. */
type CiblesOf<Faits = unknown, Cibles = unknown> = (faits: Faits) => Cibles;

/**
 * Les étapes que le modèle ajoute au chemin d'une réponse : des réponses
 * validées aux faits, par son catalogue, puis des faits aux cibles. Ce sont
 * celles de sa préconisation, sans la complétude qu'elle seule impose.
 */
export type Pipeline<Faits, Cibles> = {
  readonly faits?: FaitCatalogue<Faits & object>;
  readonly cibles?: CiblesOf<Faits, Cibles>;
};

/** Le contexte d'une question : ce qu'elle voit, passé par le `pipeline`. */
export function contextOf<Questions extends AnyQuestions, Cibles, Faits>(
  seen: SeenAnswers<Questions, Cibles | undefined>,
  pipeline: Pipeline<Faits, Cibles>,
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

/**
 * Ce que lisent les conditions d'une question : ses réponses à sa place, les
 * faits et les cibles de son contexte, et le jour.
 */
export function readingOf<Questions extends AnyQuestions, Cibles, Faits>(
  answer: AnswerReading,
  context: QuestionContext<Questions, Cibles, Faits>,
  pipeline: Pipeline<Faits, Cibles>,
): Reading {
  const named = (values: unknown, nom: string) =>
    (values as Readonly<Record<string, unknown>>)[nom];
  return {
    answer,
    fait: (nom) => named(context.faits, nom),
    cible: (nom) => named(context.cibles, nom),
    cibleAssuming: (nom, fait) => named(assuming(pipeline, context, fait), nom),
    today: () => LocalDateTime.dayInParis(new Date()),
  };
}

// ---- implémentation ----

// Les cibles de ces faits, si ce fait valait « oui ».
function assuming<Questions extends AnyQuestions, Cibles, Faits>(
  { cibles }: Pipeline<Faits, Cibles>,
  context: QuestionContext<Questions, Cibles, Faits>,
  fait: string,
): Cibles {
  if (!cibles)
    throw new Error("Ce modèle n'a pas de règles : il n'a pas de cibles.");
  const supposed = Fait.oui(`Supposé pour la garde : ${fait}.`);
  return cibles({ ...context.faits, [fait]: supposed });
}

// Étape 3 : des réponses validées aux faits, par le catalogue.
function faitsThrough<Questions extends AnyQuestions, Faits>(
  { faits }: Pipeline<Faits, unknown>,
  { validated }: SeenAnswers<Questions, unknown>,
): Faits {
  if (!faits)
    throw new Error(
      "Cette question ne connaît pas ses faits : déclare-la par les constructeurs de son modèle.",
    );
  return faits.read(validated);
}

// Étape 4 : des faits aux cibles, sauf si le verrou les a figées. Un modèle
// sans règles laisse les cibles telles que le verrou les donne.
function ciblesThrough<Questions extends AnyQuestions, Faits, Cibles>(
  { cibles }: Pipeline<Faits, Cibles>,
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
