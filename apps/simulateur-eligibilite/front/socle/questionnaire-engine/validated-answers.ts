// Lire les questions validées : la réponse de chacune, et ce qui s'y
// proposait. C'est ce qui sépare un « non » d'un fait inconnu : une case
// proposée et non cochée a été refusée, une case jamais montrée ne l'a pas été.

import { Fait } from "../../../core/socle/decision-engine/fait";
import { type Box, type Choice, GivenAnswer } from "./given-answers";
import type { AnyQuestions, Validated } from "./question";

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

  /**
   * Le fait que dit une case, selon le contrat de l'éditeur : cochée, oui ;
   * proposée sans être cochée, non. Une case qui ne se proposait pas ne dit
   * rien : `undefined`, et le modèle décide.
   */
  faitOf(box: Box<Given>): Fait | undefined {
    if (!this.offers(box)) return undefined;
    const option = `${this.id} : « ${box} »`;
    return this.checked(box)
      ? Fait.oui(`${option} cochée.`)
      : Fait.non(`${option} proposée, non cochée.`);
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
}
