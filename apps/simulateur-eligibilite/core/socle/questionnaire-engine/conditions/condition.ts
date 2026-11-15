// Une valeur lue dans les réponses, les faits ou les cibles, et ce qu'elle lit.
// Une condition est une valeur « oui ou non » : elle se compose par `and`,
// `or` et `not`, et dit toujours ce qu'elle lit, compositions comprises.
//
// Une valeur ne lit rien d'elle-même : le socle l'évalue dans un périmètre
// (`Scope`), qu'il choisit selon l'endroit. Une garde voit les questions
// posées avant elle, un fait les questions validées (`given.ts`).

import type { ValidatedAnswer } from "../answers/validated-answers.vo.ts";
import type { LocalDateTime } from "./local-date-time.vo.ts";
import { Reads } from "./reads.vo.ts";

/** Comment l'endroit voit la réponse d'une question. */
export type AnswerReading = (id: string) => ValidatedAnswer;

/**
 * Ce dans quoi une valeur se lit. Le socle la donne : la réponse d'une
 * question telle que l'endroit la voit, les faits et les cibles de ces
 * réponses, et le jour.
 */
export type Scope = {
  answer: AnswerReading;
  fait(nom: string): unknown;
  cible(nom: string): unknown;
  /** Cette cible, si ce fait valait « oui ». */
  cibleAssuming(nom: string, fait: string): unknown;
  today(): LocalDateTime;
};

/** Une valeur lue : ce qu'elle lit, et comment elle se calcule. */
export class Value<Of> {
  /** Ce qu'elle lit. */
  readonly reads: Reads;
  readonly #evaluate: (scope: Scope) => Of;

  constructor(reads: Reads, evaluate: (scope: Scope) => Of) {
    this.reads = reads;
    this.#evaluate = evaluate;
  }

  /** Ce qu'elle vaut dans cette lecture. */
  in(scope: Scope): Of {
    return this.#evaluate(scope);
  }

  /** Une valeur calculée sur celle-ci. `compute` ne reçoit que sa valeur. */
  compute<Computed>(compute: (value: Of) => Computed): Value<Computed> {
    return new Value(this.reads, (scope) => compute(this.in(scope)));
  }

  /** Une valeur calculée sur celle-ci et celle-là, qui lit les deux. */
  computeWith<Other, Computed>(
    other: Value<Other>,
    compute: (value: Of, other: Other) => Computed,
  ): Value<Computed> {
    return new Value(this.reads.with(other.reads), (scope) =>
      compute(this.in(scope), other.in(scope)),
    );
  }

  /**
   * Cette condition, et celle-là aussi. Celle-là ne se lit que si celle-ci
   * tient : ses faits et ses cibles ne se calculent pas pour rien.
   */
  and(this: Condition, other: Condition): Condition {
    return new Value(
      this.reads.with(other.reads),
      (scope) => this.in(scope) && other.in(scope),
    );
  }

  /** Cette condition, ou celle-là, qui ne se lit que si celle-ci ne tient pas. */
  or(this: Condition, other: Condition): Condition {
    return new Value(
      this.reads.with(other.reads),
      (scope) => this.in(scope) || other.in(scope),
    );
  }

  /** Le contraire de cette condition. */
  not(this: Condition): Condition {
    return this.compute((value) => !value);
  }
}

/** Une condition : une valeur « oui ou non ». */
export type Condition = Value<boolean>;

/** Un texte qui dépend des réponses, ou qui n'en dépend pas. */
export type Text = string | Value<string>;

/** Ce texte dans cette lecture. */
export function textIn(text: Text, scope: Scope): string {
  return typeof text === "string" ? text : text.in(scope);
}

/** Ce que vaut cette valeur. */
export type ValueOf<Read> = Read extends Value<infer Of> ? Of : never;

/** Ce que vaut chacune de ces valeurs, sous son nom. */
export type ValuesOf<Values> = {
  readonly [Name in keyof Values]: Values[Name] extends Value<infer Of>
    ? Of
    : never;
};

/**
 * Des valeurs nommées, lues ensemble : un calcul qui lit plusieurs réponses,
 * ou une valeur bâtie sur d'autres. Elle lit ce que lisent ses parties.
 *
 *   all({ motif: given.question("Q2.1").answer(), sens: SENS_CHOISI })
 *     .compute(({ motif, sens }) => …)
 */
export function all<Values extends Readonly<Record<string, Value<unknown>>>>(
  values: Values,
): Value<ValuesOf<Values>> {
  const entries = Object.entries(values);
  return new Value(
    Reads.union(...entries.map(([, value]) => value.reads)),
    (scope) =>
      Object.fromEntries(
        entries.map(([name, value]) => [name, value.in(scope)]),
      ) as ValuesOf<Values>,
  );
}

/** Une valeur qui ne lit rien, et vaut toujours `of`. */
export function constant<Of>(of: Of): Value<Of> {
  return new Value(Reads.none(), () => of);
}

/**
 * `value`, qui ne compte que quand la cible `cible` vaut l'une de `values`.
 * Elle se calcule toujours : c'est celui qui l'affiche qui choisit la branche
 * sur cette cible. La cible, elle, compte toujours.
 */
export function onBranch<Of>(
  cible: string,
  values: readonly unknown[],
  value: Value<Of>,
): Value<Of> {
  const reads = Reads.onBranch(cible, values, value.reads);
  return new Value(reads, (scope) => value.in(scope));
}

/** Ce qu'une valeur vaut, dans la lecture que le socle a choisie. */
export type Read = <Of>(value: Value<Of>) => Of;

/** La lecture de ces valeurs dans `scope`. */
export function readIn(scope: Scope): Read {
  return (value) => value.in(scope);
}
