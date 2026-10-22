// Ce qu'est une question, une page, une partie, une réponse.
//
// Le questionnaire est déclaré par le modèle : ses parties, ses pages, ses
// conditions d'affichage et ses dépendances. Le moteur ne connaît aucun
// identifiant : les génériques ne servent qu'à typer le modèle.

import type { Address, AddressSettings } from "./address.ts";
import type { GivenAnswers } from "./given-answers.ts";
import type { Option } from "./option.ts";
import type { ValidatedAnswers } from "./validated-answers.ts";

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

/** Les cibles d'un modèle : ce que sa préconisation rend. */
export type AnyCibles = Readonly<Record<string, unknown>>;

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
type Reminder =
  | string
  | ReadonlyArray<{ readonly label: string; readonly value: string }>;

type Common<Questions extends AnyQuestions, Cibles> = {
  readonly id: keyof Questions & string;
  readonly label: string;
  /** Le libellé, quand il dépend des réponses. Absente : `label`. */
  labelFrom?(
    answers: GivenAnswers<Questions>,
    cibles: Cibles,
    validated: ValidatedAnswers<Questions>,
  ): string;
  /** Phrase indicative, rendue sous la question. */
  readonly hint?: string;
  /**
   * Le rappel, rendu juste avant la question. Ce n'est pas une question : il
   * n'attend rien, ne se modifie pas, et ne s'affiche que si sa question se
   * pose.
   */
  readonly reminder?: Reminder;
  /**
   * Le rappel, quand il dépend des réponses ou des cibles. Absente, ou sans
   * rien à rappeler : `reminder`.
   */
  reminderFrom?(
    answers: GivenAnswers<Questions>,
    cibles: Cibles,
    validated: ValidatedAnswers<Questions>,
  ): Reminder | undefined;
  /**
   * La question peut rester sans réponse : sa page se valide sans elle.
   * L'écran le dit après son libellé.
   */
  readonly optional?: boolean;
  /**
   * La question se pose-t-elle, vu les réponses ? Absente : toujours. Après le
   * verrou, elle lit aussi les cibles figées : une question peut dépendre de la
   * préconisation.
   *
   * Écrite en méthode : TypeScript compare alors ses paramètres dans les deux
   * sens, et le moteur peut recevoir les questions typées d'un modèle.
   */
  askedIf?(
    answers: GivenAnswers<Questions>,
    cibles: Cibles,
    validated: ValidatedAnswers<Questions>,
  ): boolean;
  /**
   * Ce qui, dans la réponse, en contredit une autre : un message par
   * incohérence, qui dit quoi corriger. Vide : rien ne la contredit. Tant qu'il
   * en reste, la question n'est pas validée.
   *
   * La règle se déclare sur la plus tardive des deux questions : le moteur lui
   * cache les réponses des pages suivantes. Elle lit celles de sa page, et les
   * réponses acquises avant le verrou.
   *
   * Écrite en méthode, comme `askedIf`.
   */
  inconsistenciesFrom?(
    answers: GivenAnswers<Questions>,
    cibles: Cibles,
    validated: ValidatedAnswers<Questions>,
  ): readonly string[];
  /** Les incohérences du moment, que le moteur résout (`asked-questions.ts`). */
  readonly inconsistencies?: readonly string[];
  /**
   * Les questions dont dépend cette réponse. Quand l'une d'elles change, cette
   * réponse est effacée, et elle seule (`page-commit.ts`).
   */
  readonly dependsOn?: readonly (keyof Questions & string)[];
};

export type SingleChoice<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> = Common<Questions, Cibles> & {
  readonly kind: "single choice";
  readonly options: readonly Option<Questions, Cibles>[];
  /**
   * Rendue en liste déroulante, et non en boutons radio. Une liste ne valide
   * rien d'elle-même : sa page garde son bouton.
   */
  readonly dropdown?: boolean;
};

/** Deux options d'un choix multiple qui ne vont pas ensemble, et pourquoi. */
type IncompatibleOptions = {
  readonly values: readonly [string, string];
  /** Affichée quand cocher l'une vient de décocher l'autre. */
  readonly explanation: string;
};

export type MultipleChoice<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> = Common<Questions, Cibles> & {
  readonly kind: "multiple choice";
  readonly options: readonly Option<Questions, Cibles>[];
  /**
   * L'option exclusive : la cocher décoche les autres, et inversement. Comme
   * toute option, elle peut ne se proposer que pour certaines réponses, et
   * changer de libellé avec elles.
   */
  readonly exclusiveOption?: Option<Questions, Cibles>;
  /**
   * Les options qui s'excluent deux à deux. Cocher l'une décoche l'autre, sans
   * toucher au reste, et l'explication s'affiche.
   */
  readonly incompatibleOptions?: readonly IncompatibleOptions[];
};

type NumberInput<Questions extends AnyQuestions, Cibles> = Common<
  Questions,
  Cibles
> & {
  readonly kind: "number";
  readonly min?: number;
  readonly max?: number;
  /** N'accepte qu'un nombre entier : une décimale est refusée. */
  readonly integer?: boolean;
  readonly unit?: string;
};

type TextInput<Questions extends AnyQuestions, Cibles> = Common<
  Questions,
  Cibles
> & {
  /** `long text` : un texte sur plusieurs lignes, saisi dans une zone de texte. */
  readonly kind: "text" | "long text";
};

/**
 * Les bornes d'une date, écrites comme sa réponse : `2026-10-12` pour une
 * date, `2026-10-12T08:30` pour une date et une heure.
 */
type DateBounds = { readonly min?: string; readonly max?: string };

type DateInput<Questions extends AnyQuestions, Cibles> = Common<
  Questions,
  Cibles
> &
  DateBounds & {
    readonly kind: "date" | "datetime";
    /**
     * Les bornes, quand elles dépendent des réponses ou du jour. Elles passent
     * devant `min` et `max`.
     */
    boundsFrom?(
      answers: GivenAnswers<Questions>,
      cibles: Cibles,
      validated: ValidatedAnswers<Questions>,
    ): DateBounds;
  };

/**
 * Une case seule. Son libellé coiffe la case, et `box` est le texte de la case.
 * Sa réponse est `true` ou `false` : décochée sur une page validée, elle vaut
 * `false`, et n'est donc jamais facultative. Absente, la page n'est pas encore
 * validée.
 */
type CheckboxInput<Questions extends AnyQuestions, Cibles> = Common<
  Questions,
  Cibles
> & {
  readonly kind: "checkbox";
  readonly box: string;
};

/**
 * Une adresse, saisie champ par champ (`address.ts`). Son libellé coiffe les
 * champs.
 */
type AddressInput<Questions extends AnyQuestions, Cibles> = Common<
  Questions,
  Cibles
> &
  AddressSettings & {
    readonly kind: "address";
    /**
     * L'adresse est-elle à l'étranger, vu les réponses ? Passe devant `abroad`.
     * Sans `dependsOn`, une adresse déjà saisie survit au changement : elle se
     * relit dans le nouveau mode.
     */
    abroadIf?(
      answers: GivenAnswers<Questions>,
      cibles: Cibles,
      validated: ValidatedAnswers<Questions>,
    ): boolean;
  };

// Sans argument, ces types sont ceux du moteur : n'importe quelles questions,
// des cibles s'il y en a. Le modèle, lui, les écrit avec les siens.
export type Question<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> =
  | SingleChoice<Questions, Cibles>
  | MultipleChoice<Questions, Cibles>
  | NumberInput<Questions, Cibles>
  | TextInput<Questions, Cibles>
  | DateInput<Questions, Cibles>
  | CheckboxInput<Questions, Cibles>
  | AddressInput<Questions, Cibles>;

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
