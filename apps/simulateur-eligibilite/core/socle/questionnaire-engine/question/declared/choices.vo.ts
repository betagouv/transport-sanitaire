// Les questions à choix déclarées. Elles portent leurs réponses possibles,
// valeur et libellé, dans l'ordre du catalogue de l'éditeur, puis règlent
// celles qui en disent plus :
//
//   question.singleChoice("Q2.7", "Dans quelle tranche d'âge …")
//     .possibleAnswers({ "1_MINEUR": "…", "3_ADULTE_AUTORISEE": "…" })
//     .possibleAnswer("3_ADULTE_AUTORISEE", (possibleAnswer) =>
//       possibleAnswer.offeredWhen(desAdultesAProposer),
//     )
//
// `Reading` : les valeurs de ses réponses possibles. Une autre ne compile pas.

import type { Reads } from "../../conditions/reads.vo.ts";
import { AskedMultipleChoice, AskedSingleChoice } from "../asked/choices.vo.ts";
import type { AskedCommonData } from "../asked/common.vo.ts";
import type { QuestionContext } from "../asked/context.vo.ts";
import type {
  AnyQuestions,
  IncompatiblePossibleAnswers,
} from "../question.types.ts";
import {
  type DeclaredPossibleAnswer,
  DeclaredPossibleAnswers,
} from "./possible-answer.vo.ts";
import { DeclaredQuestion } from "./question.vo.ts";
import type { CommonSettings } from "./settings.types.ts";

/** Un choix unique déclaré. */
export class DeclaredSingleChoice<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
  Reading extends string,
  Id extends string = string,
> extends DeclaredQuestion<
  Questions,
  Cibles,
  Faits,
  SingleOwn<Questions, Cibles, Faits>,
  Id,
  Reading
> {
  readonly kind = "single choice";

  /**
   * Ses réponses possibles : chaque clé est une valeur, chaque valeur son
   * libellé, dans l'ordre du catalogue. Une clé qui a l'air d'un entier est
   * refusée.
   */
  possibleAnswers<const Labels extends Readonly<Record<string, string>>>(
    labels: Labels,
  ): DeclaredSingleChoice<Questions, Cibles, Faits, keyof Labels & string, Id> {
    const possibleAnswers = DeclaredPossibleAnswers.of<
      Questions,
      Cibles,
      Faits
    >(labels);
    return new DeclaredSingleChoice(this.settings, {
      ...this.own,
      possibleAnswers,
    });
  }

  /** Le libellé de chacune de ses réponses possibles, par valeur. */
  get labels(): Readonly<Record<Reading, string>> {
    return this.own.possibleAnswers.labels;
  }

  /**
   * Règle la réponse possible `value` : sa description, sa condition, son
   * blocage.
   */
  possibleAnswer(
    value: Reading,
    settle: Settle<Questions, Cibles, Faits>,
  ): this {
    return this.withOwn({
      possibleAnswers: this.own.possibleAnswers.settled(value, settle),
    });
  }

  /** Les seules réponses possibles proposées, dans cet ordre. Sans : toutes. */
  order(...values: Reading[]): this {
    return this.withOwn({
      possibleAnswers: this.own.possibleAnswers.ordered(values),
    });
  }

  /**
   * Affiché en liste déroulante, et non en boutons radio. Une liste ne valide
   * rien d'elle-même : sa page garde son bouton.
   */
  dropdown(): this {
    return this.withOwn({ dropdown: true });
  }

  /**
   * Les libellés des réponses possibles en gras ; leur description reste
   * dessous.
   */
  boldLabels(): this {
    return this.withOwn({ boldLabels: true });
  }

  protected override askedWith(
    common: AskedCommonData,
    context: QuestionContext<Questions, Cibles, Faits>,
  ) {
    const { possibleAnswers, dropdown, boldLabels } = this.own;
    return new AskedSingleChoice({
      ...common,
      kind: this.kind,
      dropdown,
      boldLabels,
      possibleAnswers: possibleAnswers.offeredIn(context),
    });
  }

  protected override ownGuardReads(): Reads {
    return this.own.possibleAnswers.guardReads;
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
  Reading extends string,
  Id extends string = string,
> extends DeclaredQuestion<
  Questions,
  Cibles,
  Faits,
  MultipleOwn<Questions, Cibles, Faits>,
  Id,
  readonly Reading[]
> {
  readonly kind = "multiple choice";

  /**
   * Ses réponses possibles : chaque clé est une valeur, chaque valeur son
   * libellé, dans l'ordre du catalogue. Une clé qui a l'air d'un entier est
   * refusée.
   */
  possibleAnswers<const Labels extends Readonly<Record<string, string>>>(
    labels: Labels,
  ): DeclaredMultipleChoice<
    Questions,
    Cibles,
    Faits,
    keyof Labels & string,
    Id
  > {
    const possibleAnswers = DeclaredPossibleAnswers.of<
      Questions,
      Cibles,
      Faits
    >(labels);
    return new DeclaredMultipleChoice(this.settings, {
      ...this.own,
      possibleAnswers,
    });
  }

  /** Le libellé de chacune de ses réponses possibles, par valeur. */
  get labels(): Readonly<Record<Reading, string>> {
    return this.own.possibleAnswers.labels;
  }

  /**
   * Règle la réponse possible `value` : sa description, sa condition, son
   * blocage.
   */
  possibleAnswer(
    value: Reading,
    settle: Settle<Questions, Cibles, Faits>,
  ): this {
    return this.withOwn({
      possibleAnswers: this.own.possibleAnswers.settled(value, settle),
    });
  }

  /** Les seules réponses possibles proposées, dans cet ordre. Sans : toutes. */
  order(...values: Reading[]): this {
    return this.withOwn({
      possibleAnswers: this.own.possibleAnswers.ordered(values),
    });
  }

  /**
   * La réponse possible exclusive, « Aucune » souvent : la cocher décoche les
   * autres, et inversement. Elle se règle comme les autres.
   */
  exclusive(value: Reading): this {
    return this.withOwn({ exclusive: value });
  }

  /**
   * Deux réponses possibles qui s'excluent : cocher l'une décoche l'autre, sans
   * toucher au reste, et `explanation` s'affiche.
   */
  incompatible(first: Reading, second: Reading, explanation: string): this {
    const incompatible = { values: [first, second] as const, explanation };
    return this.withOwn({
      incompatible: [...this.own.incompatible, incompatible],
    });
  }

  protected override askedWith(
    common: AskedCommonData,
    context: QuestionContext<Questions, Cibles, Faits>,
  ) {
    const { possibleAnswers, exclusive, incompatible } = this.own;
    return new AskedMultipleChoice({
      ...common,
      kind: this.kind,
      possibleAnswers: possibleAnswers.offeredIn(context, exclusive),
      exclusivePossibleAnswer:
        exclusive === undefined
          ? undefined
          : possibleAnswers.offeredOneIn(exclusive, context),
      incompatiblePossibleAnswers: incompatible,
    });
  }

  protected override ownGuardReads(): Reads {
    return this.own.possibleAnswers.guardReads;
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
  readonly possibleAnswers: DeclaredPossibleAnswers<Questions, Cibles, Faits>;
  readonly dropdown?: boolean;
  readonly boldLabels?: boolean;
};

/** Ce qu'un choix multiple règle de plus qu'une question. */
export type MultipleOwn<Questions extends AnyQuestions, Cibles, Faits> = {
  readonly possibleAnswers: DeclaredPossibleAnswers<Questions, Cibles, Faits>;
  readonly exclusive?: string;
  readonly incompatible: readonly IncompatiblePossibleAnswers[];
};

// ---- implémentation ----

// Ce qui règle une réponse possible : la lambda reçoit la réponse possible, et
// la donne réglée.
type Settle<Questions extends AnyQuestions, Cibles, Faits> = (
  possibleAnswer: DeclaredPossibleAnswer<Questions, Cibles, Faits>,
) => DeclaredPossibleAnswer<Questions, Cibles, Faits>;
