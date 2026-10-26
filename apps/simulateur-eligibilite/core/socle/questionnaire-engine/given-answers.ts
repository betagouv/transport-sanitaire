// Lire les réponses données, question par question : ce qu'une question a
// reçu, sans fouiller la structure qui les garde. Le modèle les reçoit ainsi
// dans ses conditions, ses faits et ses résultats.
//
// Une question sans réponse n'a rien de coché et n'est aucune option : ce
// n'est pas pour autant un « non ». `hasAnswer` le distingue.

import type { Address } from "./address.ts";
import type { Answer, Answers, AnyQuestions, Unanswered } from "./question.ts";

/** Ce qu'un choix unique peut valoir : une option, ou la valeur d'une case seule. */
export type Choice<Given> = Given extends readonly unknown[] | Address
  ? never
  : Given;

/** Les cases d'un choix multiple. */
export type Box<Given> = Given extends readonly (infer Option)[]
  ? Option
  : never;

/** La réponse qu'une question a reçue, ou pas encore. */
export class GivenAnswer<Given extends Answer = Answer> {
  /** L'id de la question : « Q2.1 ». */
  readonly id: string;

  /** La réponse telle quelle : un nombre, une date, un texte, une adresse. */
  readonly value: Given | Unanswered;

  constructor(id: string, value: Given | Unanswered) {
    this.id = id;
    this.value = value;
  }

  /**
   * La question a reçu sa réponse. Ce n'est pas `isAnsweredBy`, qui dit si une
   * réponse suffit à quitter sa page.
   */
  hasAnswer(): this is { readonly value: Given } {
    return this.value !== undefined;
  }

  /** La réponse est cette option. Sans réponse : non. */
  is(option: Choice<Given>): boolean {
    return this.value === option;
  }

  /** La réponse n'est pas cette option. Sans réponse : oui. */
  isNot(option: Choice<Given>): boolean {
    return !this.is(option);
  }

  /** La réponse est l'une de ces options. Sans réponse : non. */
  isOneOf(...options: readonly Choice<Given>[]): boolean {
    return options.some((option) => this.is(option));
  }

  /** Cette case est cochée. Sans réponse : non. */
  checked(box: Box<Given>): boolean {
    return this.checkedBoxes().includes(box);
  }

  /** Au moins une case est cochée. */
  hasAnyChecked(): boolean {
    return this.checkedBoxes().length > 0;
  }

  /** Les cases cochées. Sans réponse : aucune. */
  checkedBoxes(): readonly Box<Given>[] {
    return Array.isArray(this.value) ? (this.value as Box<Given>[]) : [];
  }
}

/** Les réponses données, à lire question par question. */
export class GivenAnswers<Questions extends AnyQuestions = AnyQuestions> {
  constructor(answers: Answers<Questions>) {
    RAW.set(this, answers);
  }

  /** La réponse que cette question a reçue, ou pas encore. */
  question<Id extends keyof Questions & string>(
    id: Id,
  ): GivenAnswer<Questions[Id]> {
    return new GivenAnswer(
      id,
      answersOf(this)[id] as Questions[Id] | Unanswered,
    );
  }
}

/**
 * Des réponses à lire question par question, données ou validées. Un concept
 * du modèle se construit sur les unes comme sur les autres : la garde d'une
 * page lit les premières, un fait les secondes.
 */
export type AnswersReader<Questions extends AnyQuestions = AnyQuestions> = {
  question<Id extends keyof Questions & string>(
    id: Id,
  ): GivenAnswer<Questions[Id]>;
};

/**
 * Les réponses telles que le moteur de questionnaire les garde. Le socle seul
 * les lit : le point d'entrée ne l'expose pas au modèle.
 */
export function answersOf<Questions extends AnyQuestions>(
  given: GivenAnswers<Questions>,
): Answers<Questions> {
  return RAW.get(given) as Answers<Questions>;
}

// ---- implémentation ----

// Les réponses de chaque lecture. Hors de la classe : un champ, même privé,
// se lirait encore par `given["answers"]`.
const RAW = new WeakMap<object, Answers>();
