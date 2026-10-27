// Lire les questions validées : la réponse de chacune, et ce qui s'y
// proposait. C'est ce qui sépare un « non » d'un fait inconnu : une case
// proposée et non cochée a été refusée, une case jamais montrée ne l'a pas été.

import { type Box, type Choice, GivenAnswer } from "./given-answers.ts";
import type { Answers, AnyQuestions, Validated } from "./question.ts";

/**
 * Une question validée, ou pas : sa réponse, et les options qui se
 * proposaient. Non validée, elle n'a ni réponse ni option.
 */
export class ValidatedAnswer<
  Given extends AnyQuestions[string] = AnyQuestions[string],
> extends GivenAnswer<Given> {
  readonly #offered: readonly string[] | undefined;
  readonly #validated: boolean;

  constructor(id: string, entry: Validated[string]) {
    super(id, entry?.answer as Given | undefined);
    this.#offered = entry?.offered;
    this.#validated = entry !== undefined;
  }

  /**
   * La question est validée : elle s'est posée, et sa page aussi. Une question
   * facultative restée sans réponse l'est aussi.
   */
  isValidated(): boolean {
    return this.#validated;
  }

  /** Cette option se proposait. Non validée : aucune ne se proposait. */
  offers(option: Choice<Given> | Box<Given>): boolean {
    return this.#offered?.includes(option as string) ?? false;
  }

  /** Les options qui se proposaient. Non validée : aucune. */
  offeredOptions(): readonly (Choice<Given> | Box<Given>)[] {
    return (this.#offered ?? []) as (Choice<Given> | Box<Given>)[];
  }

  /** Cette case se proposait, et n'a pas été cochée. */
  declined(box: Box<Given>): boolean {
    return this.offers(box) && !this.checked(box);
  }
}

/** Les questions validées, à lire question par question. */
export class ValidatedAnswers<Questions extends AnyQuestions = AnyQuestions> {
  readonly #validated: Validated<Questions>;

  constructor(validated: Validated<Questions>) {
    this.#validated = validated;
  }

  /** Cette question, validée ou pas. */
  question<Id extends keyof Questions & string>(
    id: Id,
  ): ValidatedAnswer<Questions[Id]> {
    return new ValidatedAnswer(id, this.#validated[id] as Validated[string]);
  }

  /**
   * Les réponses des questions validées. Une question facultative restée sans
   * réponse n'y figure pas.
   */
  answers(): Answers<Questions> {
    return Object.fromEntries(
      Object.entries(this.#validated).flatMap(([id, validated]) =>
        validated?.answer === undefined ? [] : [[id, validated.answer]],
      ),
    ) as Answers<Questions>;
  }

  /**
   * Les questions validées telles que le moteur de questionnaire les garde :
   * la trace les lit.
   */
  toJSON(): Validated<Questions> {
    return this.#validated;
  }
}
