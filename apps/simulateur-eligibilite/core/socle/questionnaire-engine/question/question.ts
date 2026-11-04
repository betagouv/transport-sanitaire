// Ce qu'est une question, une page, une partie, une réponse.
//
// Le questionnaire est déclaré par le modèle : ses parties, ses pages, ses
// conditions d'affichage et ses dépendances. Le moteur de questionnaire ne
// connaît aucun identifiant : les génériques ne servent qu'à typer le modèle.

import type { Cible } from "../../decision-engine/index.ts";
import type { Reads } from "../conditions/condition.ts";
import type { Address } from "./address.ts";
import type { SeenAnswers } from "./asked/context.ts";
import type { AskedQuestion } from "./asked/question.ts";

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

/**
 * Une question vue de ce qui lit sa réponse : son id, et le type de sa
 * réponse. Une question déclarée en est une (`question/declared/question.ts`).
 * `~answer` n'existe qu'au typage.
 */
export type Answered<Given extends Answer = Answer> = {
  readonly id: string;
  readonly "~answer": Given;
};

/** La réponse d'une question déclarée : `AnswerOf<typeof Q1_2>`. */
export type AnswerOf<Declared extends Answered> = Declared["~answer"];

/**
 * Une question désignée par son objet, ou par son id quand `Questions` type les
 * ids. Une question déclarée lit celles d'avant elle par leur objet : son
 * modèle ne connaît pas encore le type de ses réponses (`ReadByObject`).
 */
export type QuestionRef<Questions extends AnyQuestions> =
  | (keyof Questions & string)
  | Answered;

/** La réponse de la question que désigne `Ref`. */
export type AnswerOfRef<Questions extends AnyQuestions, Ref> =
  Ref extends Answered<infer Given>
    ? Given
    : Ref extends keyof Questions
      ? Questions[Ref]
      : never;

/** L'id de la question que désigne `question`. */
export function idOf(question: string | Answered): string {
  return typeof question === "string" ? question : question.id;
}

/**
 * Aucun id typé : les questions se lisent par leur objet. Ce sont les
 * déclarations d'un modèle qui ne voient que celles-là. Son type `Questions`
 * se tire de ses parties (`AnswersOf`), donc de ces déclarations : elles ne
 * peuvent pas le lire.
 */
export type ReadByObject = Readonly<Record<never, Answer>>;

/**
 * Les réponses des questions de ces parties, par id : le type `Questions`
 * d'un modèle, tiré de ses déclarations.
 *
 *   export type Questions = AnswersOf<typeof P1 | typeof P2>;
 */
export type AnswersOf<
  Part extends {
    readonly pages: readonly { readonly questions: readonly unknown[] }[];
  },
> = {
  readonly [Declared in Part["pages"][number]["questions"][number] as Declared extends Answered
    ? Declared["id"]
    : never]: Declared extends Answered<infer Given> ? Given : never;
};

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
 * ses constructeurs (`question/declared/factory.ts`, `question/declared/question.ts`).
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
   * réponse est effacée (`validate-a-page.ts`).
   */
  readonly dependencies: readonly string[];
  /**
   * Ce que lisent ses gardes, celles de ses options comprises : les réponses,
   * les faits et les cibles qui décident si elle se pose, et ce qu'elle propose.
   */
  readonly guardReads: Reads;
  /**
   * Ce que lisent ses conditions, sans ses options : ce qui décide seul si
   * elle se pose (`does-a-question-still-matter/can-still-be-asked.ts`).
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
export function afterLock<
  Part extends {
    readonly pages: readonly {
      readonly id: string;
      readonly questions: unknown;
    }[];
  },
>(part: Part): Part {
  const pages = part.pages.map(({ id, questions }) => ({
    id,
    questions,
    afterLock: true as const,
  }));
  return { ...part, pages } as Part;
}

/** Les pages de ces parties, dans l'ordre du questionnaire. */
export function pagesOf(parts: readonly QuestionnairePart[]): Page[] {
  return parts.flatMap((part) => part.pages);
}
