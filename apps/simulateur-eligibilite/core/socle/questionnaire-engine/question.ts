// Ce qu'est une question, une page, une partie, une réponse.
//
// Le questionnaire est déclaré par le modèle : ses parties, ses pages, ses
// conditions d'affichage et ses dépendances. Le moteur de questionnaire ne
// connaît aucun identifiant : les génériques ne servent qu'à typer le modèle.

import type { Cible } from "../decision-engine/cible.ts";
import type { Address } from "./address.ts";
import type { AskedQuestion } from "./asked-question.ts";
import type { Reads } from "./condition.ts";
import type { SeenAnswers } from "./question-context.ts";

/**
 * Une réponse : un choix, un nombre, un texte, les cases cochées, une case
 * seule, ou une adresse.
 */
export type Answer = string | number | boolean | readonly string[] | Address;

/**
 * Pas de réponse : la question ne l'a pas encore reçue, ou ne se pose pas. Ce
 * n'est ni oui, ni non. `GivenAnswer.hasAnswer` le teste.
 */
export type Unanswered = undefined;

/** La question ne se pose pas. */
export type NotAsked = undefined;

/** Les questions d'un modèle : pour chacune, le type de sa réponse. */
export type AnyQuestions = Readonly<Record<string, Answer>>;

/** Les réponses données à un instant, par question. Il peut en manquer. */
export type Answers<Questions extends AnyQuestions = AnyQuestions> = Readonly<
  Partial<Questions>
>;

/** Les cibles d'un modèle : ce que sa préconisation calcule. */
export type AnyCibles = Readonly<Record<string, Cible>>;

/**
 * Les questions validées, par question : ce qui s'y proposait, et ce qui y a
 * été répondu. Une question absente n'est pas validée : elle ne se posait pas,
 * ou attend encore sa réponse.
 */
export type Validated<Questions extends AnyQuestions = AnyQuestions> = {
  readonly [Id in keyof Questions]?: {
    /** Les options qui se proposaient. Absente : une saisie libre. */
    readonly offered?: readonly string[];
    /** Absente : la question, facultative, est restée sans réponse. */
    readonly answer?: Questions[Id];
  };
};

/**
 * Un rappel : ce qui est déjà connu, redit avant la question qu'il éclaire. Il
 * prend deux formes : une phrase, ou des valeurs avec leur intitulé, comme le
 * rôle et la nature d'un lieu au-dessus de son adresse.
 */
export type Reminder =
  | string
  | ReadonlyArray<{ readonly label: string; readonly value: string }>;

/** Deux options d'un choix multiple qui ne vont pas ensemble, et pourquoi. */
export type IncompatibleOptions = {
  readonly values: readonly [string, string];
  /** Affichée quand cocher l'une vient de décocher l'autre. */
  readonly explanation: string;
};

/**
 * Une question, telle que le moteur de questionnaire la lit : elle sait comment
 * elle se pose, et de quelles réponses elle dépend. Le modèle la déclare par
 * ses constructeurs (`question-factory.ts`, `declared-question.ts`).
 *
 * `askedIn` est écrite en méthode : TypeScript compare alors ses paramètres
 * dans les deux sens, et le moteur de questionnaire peut recevoir les questions
 * typées d'un modèle. Sans argument, ce sont les siennes : n'importe quelles
 * questions, des cibles s'il y en a.
 */
export type Question<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> = {
  readonly id: keyof Questions & string;
  readonly kind: AskedQuestion["kind"];
  /**
   * Les questions dont dépend cette réponse. Quand l'une d'elles change, cette
   * réponse est effacée (`page-commit.ts`).
   */
  readonly dependencies: readonly string[];
  /**
   * Ce que lisent ses gardes, celles de ses options comprises : les réponses,
   * les faits et les cibles qui décident si elle se pose, et ce qu'elle propose.
   */
  readonly guardReads: Reads;
  /**
   * Ce que lisent ses conditions, sans ses options : ce qui décide seul si
   * elle se pose (`askability.ts`).
   */
  readonly conditionReads: Reads;
  /**
   * Ce que lisent ses incohérences, qui bloquent la suite du parcours. `null` :
   * elle n'en a pas.
   */
  readonly inconsistencyReads: Reads | null;
  /** Elle se pose même si sa réponse ne change rien de ce qui compte. */
  readonly isAlwaysAsked: boolean;
  /**
   * La question telle qu'elle se pose, vu les réponses, si elle s'y pose. Ses incohérences lisent `earlier`, sans les pages suivantes.
   */
  askedIn(
    seen: SeenAnswers<Questions, Cibles>,
    earlier: SeenAnswers<Questions, Cibles>,
  ): AskedQuestion | NotAsked;
};

export type Page<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> = {
  readonly id: string;
  readonly questions: readonly Question<Questions, Cibles>[];
  /**
   * Posée après le verrou : ses questions lisent les cibles figées. Sinon,
   * celles que le modèle calcule sur les faits d'avant elles (`afterLock`).
   */
  readonly afterLock?: true;
};

/**
 * Une partie du questionnaire : ses pages, dans l'ordre. Le stepper compte les
 * parties, pas les pages. Le titre coiffe chacune de ses pages.
 */
export type QuestionnairePart<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> = {
  readonly id: string;
  readonly title: string;
  readonly pages: readonly Page<Questions, Cibles>[];
};

/**
 * Cette partie, posée après le verrou : ses pages lisent les cibles figées, et
 * plus celles des faits d'avant elles. Elle complète, elle ne décide plus.
 */
export function afterLock<Questions extends AnyQuestions, Cibles>(
  part: QuestionnairePart<Questions, Cibles>,
): QuestionnairePart<Questions, Cibles> {
  const pages = part.pages.map(({ id, questions }) => ({
    id,
    questions,
    afterLock: true as const,
  }));
  return { ...part, pages };
}

/** Les pages de ces parties, dans l'ordre du questionnaire. */
export function pagesOf(parts: readonly QuestionnairePart[]): Page[] {
  return parts.flatMap((part) => part.pages);
}
