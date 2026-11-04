// Les questions à choix déclarées. Elles portent leurs options, valeur et
// libellé, dans l'ordre du catalogue de l'éditeur, puis règlent celles qui en
// disent plus :
//
//   question.singleChoice("Q2.7", "Dans quelle tranche d'âge …")
//     .options({ "1_MINEUR": "…", "3_ADULTE_AUTORISEE": "…" })
//     .option("3_ADULTE_AUTORISEE", (option) => option.offeredWhen(desAdultesAProposer))
//
// `Value` : les valeurs de ses options. Une autre ne compile pas.

import type { Reads, Scope } from "../../conditions/condition.ts";
import { AskedMultipleChoice, AskedSingleChoice } from "../asked/choices.ts";
import type { AskedCommonData } from "../asked/common.ts";
import type { QuestionContext } from "../asked/context.ts";
import type { AnyQuestions, IncompatibleOptions } from "../question.ts";
import { type DeclaredOption, DeclaredOptions } from "./option.ts";
import { DeclaredQuestion } from "./question.ts";
import type { CommonSettings } from "./settings.ts";

/** Un choix unique déclaré. */
export class DeclaredSingleChoice<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
  Value extends string,
  Id extends string = string,
> extends DeclaredQuestion<
  Questions,
  Cibles,
  Faits,
  SingleOwn<Questions, Cibles, Faits>,
  Id,
  Value
> {
  readonly kind = "single choice";

  /**
   * Ses options : chaque clé est une valeur, chaque valeur son libellé, dans
   * l'ordre du catalogue. Une clé qui a l'air d'un entier est refusée.
   */
  options<const Labels extends Readonly<Record<string, string>>>(
    labels: Labels,
  ): DeclaredSingleChoice<Questions, Cibles, Faits, keyof Labels & string, Id> {
    const options = DeclaredOptions.of<Questions, Cibles, Faits>(labels);
    return new DeclaredSingleChoice(this.settings, { ...this.own, options });
  }

  /** Le libellé de chacune de ses options, par valeur. */
  get labels(): Readonly<Record<Value, string>> {
    return this.own.options.labels;
  }

  /** Règle l'option `value` : sa description, sa condition, son blocage. */
  option(value: Value, settle: Settle<Questions, Cibles, Faits>): this {
    return this.withOwn({ options: this.own.options.settled(value, settle) });
  }

  /** Les seules options proposées, dans cet ordre. Sans : toutes. */
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

  /** Les libellés des options en gras ; leur description reste dessous. */
  boldLabels(): this {
    return this.withOwn({ boldLabels: true });
  }

  protected override askedWith(
    common: AskedCommonData,
    context: QuestionContext<Questions, Cibles, Faits>,
    scope: Scope,
  ) {
    const { options, dropdown, boldLabels } = this.own;
    return new AskedSingleChoice({
      ...common,
      kind: this.kind,
      dropdown,
      boldLabels,
      options: options.offeredIn(context, scope),
    });
  }

  protected override ownGuardReads(): Reads {
    return this.own.options.guardReads;
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
  Id extends string = string,
> extends DeclaredQuestion<
  Questions,
  Cibles,
  Faits,
  MultipleOwn<Questions, Cibles, Faits>,
  Id,
  readonly Value[]
> {
  readonly kind = "multiple choice";

  /**
   * Ses options : chaque clé est une valeur, chaque valeur son libellé, dans
   * l'ordre du catalogue. Une clé qui a l'air d'un entier est refusée.
   */
  options<const Labels extends Readonly<Record<string, string>>>(
    labels: Labels,
  ): DeclaredMultipleChoice<
    Questions,
    Cibles,
    Faits,
    keyof Labels & string,
    Id
  > {
    const options = DeclaredOptions.of<Questions, Cibles, Faits>(labels);
    return new DeclaredMultipleChoice(this.settings, { ...this.own, options });
  }

  /** Le libellé de chacune de ses options, par valeur. */
  get labels(): Readonly<Record<Value, string>> {
    return this.own.options.labels;
  }

  /** Règle l'option `value` : sa description, sa condition, son blocage. */
  option(value: Value, settle: Settle<Questions, Cibles, Faits>): this {
    return this.withOwn({ options: this.own.options.settled(value, settle) });
  }

  /** Les seules options proposées, dans cet ordre. Sans : toutes. */
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
    scope: Scope,
  ) {
    const { options, exclusive, incompatible } = this.own;
    return new AskedMultipleChoice({
      ...common,
      kind: this.kind,
      options: options.offeredIn(context, scope, exclusive),
      exclusiveOption:
        exclusive === undefined
          ? undefined
          : options.offeredOneIn(exclusive, context, scope),
      incompatibleOptions: incompatible,
    });
  }

  protected override ownGuardReads(): Reads {
    return this.own.options.guardReads;
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
  readonly boldLabels?: boolean;
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
