// Une lecture des réponses, des faits ou des cibles : ce qu'elle lit, et ce
// qu'elle vaut une fois lue. Une condition est une lecture « oui ou non » :
// elle se compose par `and`, `or` et `not`, et dit toujours ce qu'elle lit,
// compositions comprises.
//
// Une lecture ne vaut rien d'elle-même : elle se lit dans un contexte
// (`Context`), celui de l'endroit. Une question voit les questions posées
// avant elle (`question/asked/context.vo.ts`), un fait et un résultat les
// questions validées.

import type { ValidatedAnswer } from "../answers/validated-answers.vo.ts";
import type { LocalDateTime } from "./local-date-time.vo.ts";
import { Reads } from "./reads.vo.ts";

/** Comment l'endroit voit la réponse d'une question. */
export type ReadAnswer = (id: string) => ValidatedAnswer;

/**
 * Le contexte où une lecture se fait, selon l'endroit : la réponse d'une
 * question telle qu'on l'y voit, les faits, les cibles et le jour. Une
 * question, un fait et un résultat ont chacun le leur.
 */
export type Context = {
  answer: ReadAnswer;
  fait(nom: string): unknown;
  cible(nom: string): unknown;
  /** Cette cible, si ce fait valait « oui ». */
  cibleAssuming(nom: string, fait: string): unknown;
  today(): LocalDateTime;
};

/** Une lecture : ce qu'elle lit, et comment elle se calcule. */
export class Reading<Of> {
  /** Ce qu'elle lit. */
  readonly reads: Reads;
  readonly #evaluate: (context: Context) => Of;

  constructor(reads: Reads, evaluate: (context: Context) => Of) {
    this.reads = reads;
    this.#evaluate = evaluate;
  }

  /** Ce qu'elle vaut dans ce contexte. */
  in(context: Context): Of {
    return this.#evaluate(context);
  }

  /** Une lecture calculée sur celle-ci. `compute` ne reçoit que sa valeur. */
  compute<Computed>(compute: (value: Of) => Computed): Reading<Computed> {
    return new Reading(this.reads, (context) => compute(this.in(context)));
  }

  /** Une lecture calculée sur celle-ci et celle-là, qui lit les deux. */
  computeWith<Other, Computed>(
    other: Reading<Other>,
    compute: (value: Of, other: Other) => Computed,
  ): Reading<Computed> {
    return new Reading(this.reads.with(other.reads), (context) =>
      compute(this.in(context), other.in(context)),
    );
  }

  /**
   * Cette condition, et celle-là aussi. Celle-là ne se lit que si celle-ci
   * tient : ses faits et ses cibles ne se calculent pas pour rien.
   */
  and(this: Condition, other: Condition): Condition {
    return new Reading(
      this.reads.with(other.reads),
      (context) => this.in(context) && other.in(context),
    );
  }

  /** Cette condition, ou celle-là, qui ne se lit que si celle-ci ne tient pas. */
  or(this: Condition, other: Condition): Condition {
    return new Reading(
      this.reads.with(other.reads),
      (context) => this.in(context) || other.in(context),
    );
  }

  /** Le contraire de cette condition. */
  not(this: Condition): Condition {
    return this.compute((value) => !value);
  }
}

/** Une condition : une lecture « oui ou non ». */
export type Condition = Reading<boolean>;

/** Un texte qui dépend des réponses, ou qui n'en dépend pas. */
export type Text = string | Reading<string>;

/** Ce texte dans ce contexte. */
export function textIn(text: Text, context: Context): string {
  return typeof text === "string" ? text : text.in(context);
}

/** Ce que vaut cette lecture. */
export type ValueOf<Read> = Read extends Reading<infer Of> ? Of : never;

/** Ce que vaut chacune de ces lectures, sous son nom. */
export type ValuesOf<Values> = {
  readonly [Name in keyof Values]: Values[Name] extends Reading<infer Of>
    ? Of
    : never;
};

/**
 * Des lectures nommées, faites ensemble : un calcul qui lit plusieurs réponses,
 * ou une lecture bâtie sur d'autres. Elle lit ce que lisent ses parties.
 *
 *   all({ motif: given.question("Q2.1").answer(), sens: SENS_CHOISI })
 *     .compute(({ motif, sens }) => …)
 */
export function all<Values extends Readonly<Record<string, Reading<unknown>>>>(
  values: Values,
): Reading<ValuesOf<Values>> {
  const entries = Object.entries(values);
  return new Reading(
    Reads.union(...entries.map(([, value]) => value.reads)),
    (context) =>
      Object.fromEntries(
        entries.map(([name, value]) => [name, value.in(context)]),
      ) as ValuesOf<Values>,
  );
}

/** Une lecture qui ne lit rien, et vaut toujours `of`. */
export function constant<Of>(of: Of): Reading<Of> {
  return new Reading(Reads.none(), () => of);
}

/**
 * `value`, qui ne compte que quand la cible `cible` vaut l'une de `values`.
 * Elle se calcule toujours : c'est celui qui l'affiche qui choisit la branche
 * sur cette cible. La cible, elle, compte toujours.
 */
export function onBranch<Of>(
  cible: string,
  values: readonly unknown[],
  value: Reading<Of>,
): Reading<Of> {
  const reads = Reads.onBranch(cible, values, value.reads);
  return new Reading(reads, (context) => value.in(context));
}

/** Ce qu'une lecture vaut, dans le contexte que le socle a choisi. */
export type Read = <Of>(value: Reading<Of>) => Of;

/** La lecture de ces valeurs dans `context`. */
export function readIn(context: Context): Read {
  return (value) => value.in(context);
}
