// Lire les questions validées : la réponse de chacune, et ce qui s'y
// proposait. C'est ce qui sépare un « non » d'un fait inconnu : une case
// proposée et non cochée a été refusée, une case jamais montrée ne l'a pas été.

import type { ReadAnswer } from "../conditions/reading.vo.ts";
import type {
  Answer,
  Answered,
  Answers,
  AnyQuestions,
  Validated,
} from "../question/question.types.ts";
import { QuestionId } from "../question/question-id.vo.ts";
import { type Box, type Choice, GivenAnswer } from "./given-answers.vo.ts";

/**
 * Une question validée, ou pas : sa réponse, et les réponses possibles qui se
 * proposaient. Non validée, elle n'a ni réponse ni réponse possible.
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

  /**
   * Cette réponse possible se proposait. Non validée : aucune ne se proposait.
   */
  offers(possibleAnswer: Choice<Given> | Box<Given>): boolean {
    return this.#offered?.includes(possibleAnswer as string) ?? false;
  }

  /** Les réponses possibles qui se proposaient. Non validée : aucune. */
  offeredPossibleAnswers(): readonly (Choice<Given> | Box<Given>)[] {
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
  question<Given extends Answer>(
    question: Answered<Given>,
  ): ValidatedAnswer<Given>;
  question<Id extends keyof Questions & string>(
    id: Id,
  ): ValidatedAnswer<Questions[Id]>;
  question(question: string | Answered): ValidatedAnswer {
    const id = QuestionId.of(question).value;
    const validated: Validated = this.#validated;
    return new ValidatedAnswer(id, validated[id]);
  }

  /** La lecture d'un fait, de R2 ou de R3 : la réponse validée. */
  reading(): ReadAnswer {
    return (id) => this.question(id);
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

  /**
   * Les mêmes questions validées, avec les mêmes réponses et les mêmes
   * réponses possibles proposées. L'ordre des cases cochées ne compte pas.
   */
  sameAs(other: ValidatedAnswers<Questions>): boolean {
    return canonical(this.#validated) === canonical(other.#validated);
  }
}

// ---- implémentation ----

// Une écriture qui ne dépend d'aucun ordre : ni des clés, ni des listes.
function canonical(value: unknown): string {
  return JSON.stringify(sorted(value));
}

function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted).sort();
  if (value === null || typeof value !== "object") return value;
  return Object.entries(value)
    .filter(([, entry]) => entry !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, entry]) => [key, sorted(entry)]);
}
