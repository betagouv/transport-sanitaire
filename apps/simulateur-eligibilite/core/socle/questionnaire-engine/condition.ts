// Une valeur lue dans les réponses, les faits ou les cibles, et ce qu'elle lit.
// Une condition est une valeur « oui ou non » : elle se compose par `and`,
// `or` et `not`, et dit toujours ce qu'elle lit, compositions comprises.
//
// Une valeur ne lit rien d'elle-même : le socle l'évalue dans une lecture
// (`Reading`), qu'il choisit selon l'endroit. Une garde voit les questions
// posées avant elle, un fait les questions validées (`given.ts`).

import type { LocalDateTime } from "./local-date-time.ts";
import type { ValidatedAnswer } from "./validated-answers.ts";

/** Ce qu'une valeur lit : des questions, des faits, des cibles. */
export type Reads = {
  readonly questions: readonly string[];
  readonly faits: readonly string[];
  readonly cibles: readonly string[];
};

/**
 * Ce dans quoi une valeur se lit. Le socle la donne : la réponse d'une
 * question telle que l'endroit la voit, les faits et les cibles de ces
 * réponses, et le jour.
 */
export type Reading = {
  answer(id: string): ValidatedAnswer;
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
  readonly #evaluate: (reading: Reading) => Of;

  constructor(reads: Reads, evaluate: (reading: Reading) => Of) {
    this.reads = reads;
    this.#evaluate = evaluate;
  }

  /** Ce qu'elle vaut dans cette lecture. */
  in(reading: Reading): Of {
    return this.#evaluate(reading);
  }

  /** Une valeur calculée sur celle-ci. `compute` ne reçoit que sa valeur. */
  compute<Computed>(compute: (value: Of) => Computed): Value<Computed> {
    return new Value(this.reads, (reading) => compute(this.in(reading)));
  }

  /** Une valeur calculée sur celle-ci et celle-là, qui lit les deux. */
  computeWith<Other, Computed>(
    other: Value<Other>,
    compute: (value: Of, other: Other) => Computed,
  ): Value<Computed> {
    return new Value(readsOf(this.reads, other.reads), (reading) =>
      compute(this.in(reading), other.in(reading)),
    );
  }

  /**
   * Cette condition, et celle-là aussi. Celle-là ne se lit que si celle-ci
   * tient : ses faits et ses cibles ne se calculent pas pour rien.
   */
  and(this: Condition, other: Condition): Condition {
    return new Value(
      readsOf(this.reads, other.reads),
      (reading) => this.in(reading) && other.in(reading),
    );
  }

  /** Cette condition, ou celle-là, qui ne se lit que si celle-ci ne tient pas. */
  or(this: Condition, other: Condition): Condition {
    return new Value(
      readsOf(this.reads, other.reads),
      (reading) => this.in(reading) || other.in(reading),
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
export function textIn(text: Text, reading: Reading): string {
  return typeof text === "string" ? text : text.in(reading);
}

/** Rien de lu. */
export const NOTHING: Reads = { questions: [], faits: [], cibles: [] };

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
 *   all({ motif: given.question("Q2.1").answer(), sens: SENS_DU_DOCUMENT })
 *     .compute(({ motif, sens }) => …)
 */
export function all<Values extends Readonly<Record<string, Value<unknown>>>>(
  values: Values,
): Value<ValuesOf<Values>> {
  const entries = Object.entries(values);
  return new Value(
    entries.map(([, value]) => value.reads).reduce(readsOf, NOTHING),
    (reading) =>
      Object.fromEntries(
        entries.map(([name, value]) => [name, value.in(reading)]),
      ) as ValuesOf<Values>,
  );
}

/** Une valeur qui ne lit rien, et vaut toujours `of`. */
export function constant<Of>(of: Of): Value<Of> {
  return new Value(NOTHING, () => of);
}

/** Ce que lisent ces deux valeurs, chaque chose une fois. */
export function readsOf(a: Reads, b: Reads): Reads {
  const union = (x: readonly string[], y: readonly string[]) => [
    ...new Set([...x, ...y]),
  ];
  return {
    questions: union(a.questions, b.questions),
    faits: union(a.faits, b.faits),
    cibles: union(a.cibles, b.cibles),
  };
}

/** Ce qu'une valeur vaut, dans la lecture que le socle a choisie. */
export type Read = <Of>(value: Value<Of>) => Of;

/** La lecture de ces valeurs dans `reading`. */
export function readIn(reading: Reading): Read {
  return (value) => value.in(reading);
}
