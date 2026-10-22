// Ce qu'est une question, une page, une partie, une réponse.
//
// Le questionnaire est déclaré par le modèle : ses parties, ses pages, ses
// conditions d'affichage et ses dépendances. Le moteur ne connaît aucun
// identifiant : les génériques ne servent qu'à typer le modèle.

import type { Cible } from "../decision-engine/cible.ts";
import type { Address } from "./address.ts";
import type { AskedQuestion } from "./asked-question.ts";
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
 * Une question, telle que le moteur la lit : elle sait comment elle se pose, et
 * de quelles réponses elle dépend. Le modèle la déclare par ses constructeurs
 * (`question-factory.ts`, `declared-question.ts`).
 *
 * `askedIn` est écrite en méthode : TypeScript compare alors ses paramètres
 * dans les deux sens, et le moteur peut recevoir les questions typées d'un
 * modèle. Sans argument, ce sont celles du moteur : n'importe quelles
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
   * La question telle qu'elle se pose, vu les réponses. `undefined` : elle ne
   * s'y pose pas. Ses incohérences lisent `earlier`, sans les pages suivantes.
   */
  askedIn(
    seen: SeenAnswers<Questions, Cibles>,
    earlier: SeenAnswers<Questions, Cibles>,
  ): AskedQuestion | undefined;
};

export type Page<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> = {
  readonly id: string;
  readonly questions: readonly Question<Questions, Cibles>[];
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

/** Les pages de ces parties, dans l'ordre du questionnaire. */
export function pagesOf(parts: readonly QuestionnairePart[]): Page[] {
  return parts.flatMap((part) => part.pages);
}
