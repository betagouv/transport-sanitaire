// Les questions à choix déclarées. Leurs options viennent du catalogue de
// l'éditeur, et le modèle n'en règle que ce qui change :
//
//   question.singleChoice("Q2.7", "Dans quelle tranche d'âge …")
//     .option("3_ADULTE_AUTORISEE", (option) => option.offeredIf(adultes))
//
// `Value` : les valeurs du catalogue. Une autre ne compile pas.

import { AskedMultipleChoice, AskedSingleChoice } from "./asked-choices.ts";
import type { AskedCommonData } from "./asked-common.ts";
import type { DeclaredOption, DeclaredOptions } from "./declared-option.ts";
import { type CommonSettings, DeclaredQuestion } from "./declared-question.ts";
import type { AnyQuestions, IncompatibleOptions } from "./question.ts";
import type { QuestionContext } from "./question-context.ts";

/** Un choix unique déclaré. */
export class DeclaredSingleChoice<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
  Value extends string,
> extends DeclaredQuestion<
  Questions,
  Cibles,
  Faits,
  SingleOwn<Questions, Cibles, Faits>
> {
  readonly kind = "single choice";

  /** Règle l'option `value` : sa description, sa condition, son blocage. */
  option(value: Value, settle: Settle<Questions, Cibles, Faits>): this {
    return this.withOwn({ options: this.own.options.settled(value, settle) });
  }

  /** Les seules options proposées, dans cet ordre. Sans : tout le catalogue. */
  order(...values: Value[]): this {
    return this.withOwn({ options: this.own.options.ordered(values) });
  }

  /**
   * Affiché en liste déroulante, et non en boutons radio. Une liste ne valide
   * rien d'elle-même : sa page garde son bouton.
   */
  dropdown(): this {
    return this.withOwn({ dropdown: true });
  }

  protected override askedWith(
    common: AskedCommonData,
    context: QuestionContext<Questions, Cibles, Faits>,
  ) {
    const { options, dropdown } = this.own;
    return new AskedSingleChoice({
      ...common,
      kind: this.kind,
      dropdown,
      options: options.offeredIn(context),
    });
  }

  protected override rebuilt(
    settings: CommonSettings<Questions, Cibles, Faits>,
    own: SingleOwn<Questions, Cibles, Faits>,
  ) {
    return new DeclaredSingleChoice(settings, own) as this;
  }
}

/** Un choix multiple déclaré. */
export class DeclaredMultipleChoice<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
  Value extends string,
> extends DeclaredQuestion<
  Questions,
  Cibles,
  Faits,
  MultipleOwn<Questions, Cibles, Faits>
> {
  readonly kind = "multiple choice";

  /** Règle l'option `value` : sa description, sa condition, son blocage. */
  option(value: Value, settle: Settle<Questions, Cibles, Faits>): this {
    return this.withOwn({ options: this.own.options.settled(value, settle) });
  }

  /** Les seules options proposées, dans cet ordre. Sans : tout le catalogue. */
  order(...values: Value[]): this {
    return this.withOwn({ options: this.own.options.ordered(values) });
  }

  /**
   * L'option exclusive, « Aucune » souvent : la cocher décoche les autres, et
   * inversement. Elle se règle comme les autres.
   */
  exclusive(value: Value): this {
    return this.withOwn({ exclusive: value });
  }

  /**
   * Deux options qui s'excluent : cocher l'une décoche l'autre, sans toucher
   * au reste, et `explanation` s'affiche.
   */
  incompatible(first: Value, second: Value, explanation: string): this {
    const incompatible = { values: [first, second] as const, explanation };
    return this.withOwn({
      incompatible: [...this.own.incompatible, incompatible],
    });
  }

  protected override askedWith(
    common: AskedCommonData,
    context: QuestionContext<Questions, Cibles, Faits>,
  ) {
    const { options, exclusive, incompatible } = this.own;
    return new AskedMultipleChoice({
      ...common,
      kind: this.kind,
      options: options.offeredIn(context, exclusive),
      exclusiveOption:
        exclusive === undefined
          ? undefined
          : options.offeredOneIn(exclusive, context),
      incompatibleOptions: incompatible,
    });
  }

  protected override rebuilt(
    settings: CommonSettings<Questions, Cibles, Faits>,
    own: MultipleOwn<Questions, Cibles, Faits>,
  ) {
    return new DeclaredMultipleChoice(settings, own) as this;
  }
}

/** Ce qu'un choix unique règle de plus qu'une question. */
export type SingleOwn<Questions extends AnyQuestions, Cibles, Faits> = {
  readonly options: DeclaredOptions<Questions, Cibles, Faits>;
  readonly dropdown?: boolean;
};

/** Ce qu'un choix multiple règle de plus qu'une question. */
export type MultipleOwn<Questions extends AnyQuestions, Cibles, Faits> = {
  readonly options: DeclaredOptions<Questions, Cibles, Faits>;
  readonly exclusive?: string;
  readonly incompatible: readonly IncompatibleOptions[];
};

// ---- implémentation ----

// Ce qui règle une option : la lambda reçoit l'option, et la donne réglée.
type Settle<Questions extends AnyQuestions, Cibles, Faits> = (
  option: DeclaredOption<Questions, Cibles, Faits>,
) => DeclaredOption<Questions, Cibles, Faits>;
