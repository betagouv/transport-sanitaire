// Les réponses possibles d'une question à choix déclarée : leurs valeurs et
// leurs libellés, que la question déclare (`.possibleAnswers`). Le modèle en
// règle chacune par une lambda, tous ses réglages au même endroit :
//
//   .possibleAnswer("6_SEANCE", (possibleAnswer) =>
//     possibleAnswer.description("…").offeredWhen(…),
//   )
//
// Une réponse possible ne change pas : chaque réglage donne une copie.

import type { Condition } from "../../conditions/condition.ts";
import { Reads } from "../../conditions/reads.vo.ts";
import { QuestionnaireDeclarationError } from "../../questionnaire-declaration.error.ts";
import type { QuestionContext } from "../asked/context.vo.ts";
import type {
  NotOffered,
  OfferedPossibleAnswer,
  PossibleAnswerHelp,
} from "../possible-answer.ts";
import type { AnyQuestions } from "../question.ts";

/** La réponse possible n'a pas d'aide dans ce cas. */
type NoHelp = undefined;

/**
 * Une réponse possible déclarée : son libellé, ce qui la fait se proposer, son
 * aide.
 */
export class DeclaredPossibleAnswer<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
> {
  readonly #settings: PossibleAnswerSettings<Questions, Cibles, Faits>;

  constructor(settings: PossibleAnswerSettings<Questions, Cibles, Faits>) {
    this.#settings = settings;
  }

  get value(): string {
    return this.#settings.value;
  }

  /** Son libellé déclaré, avant celui du moment (`labelFrom`). */
  get label(): string {
    return this.#settings.label;
  }

  /** Ce que lisent ses gardes (`offeredWhen`). */
  get guardReads(): Reads {
    return Reads.union(...this.#settings.conditions.map(({ reads }) => reads));
  }

  /**
   * Ce que la réponse possible veut dire, affiché sous son libellé. Un saut de
   * ligne (`\n`) y commence une ligne.
   */
  description(
    description: string,
  ): DeclaredPossibleAnswer<Questions, Cibles, Faits> {
    return this.#with({ description });
  }

  /**
   * La réponse possible se propose quand cette condition tient. Chaque appel en
   * ajoute une. Une réponse qui la portait la perd quand elle ne se propose
   * plus.
   */
  offeredWhen(
    condition: Condition,
  ): DeclaredPossibleAnswer<Questions, Cibles, Faits> {
    return this.#with({
      conditions: [...this.#settings.conditions, condition],
    });
  }

  /** Le libellé, quand il dépend des réponses. */
  labelFrom(
    label: (context: Context<Questions, Cibles, Faits>) => string,
  ): DeclaredPossibleAnswer<Questions, Cibles, Faits> {
    return this.#with({ labelFrom: label });
  }

  /**
   * Choisir cette réponse possible arrête le questionnaire sur sa page : ce
   * message s'affiche, et on n'avance plus tant qu'elle reste choisie.
   */
  blocks(message: string): DeclaredPossibleAnswer<Questions, Cibles, Faits> {
    return this.#with({ blocks: message });
  }

  /** L'aide dépliable de la réponse possible, qui dépend des réponses. */
  helpFrom(
    help: (
      context: Context<Questions, Cibles, Faits>,
    ) => PossibleAnswerHelp | NoHelp,
  ): DeclaredPossibleAnswer<Questions, Cibles, Faits> {
    return this.#with({ helpFrom: help });
  }

  /** La réponse possible telle qu'elle se propose, si elle se propose. */
  offeredIn(
    context: Context<Questions, Cibles, Faits>,
  ): OfferedPossibleAnswer | NotOffered {
    const { value, description, blocks, conditions } = this.#settings;
    if (!conditions.every((condition) => condition.in(context)))
      return undefined;
    const help = this.#settings.helpFrom?.(context);
    return {
      value,
      label: this.#settings.labelFrom?.(context) ?? this.#settings.label,
      ...(description !== undefined && { description }),
      ...(blocks !== undefined && { blocks }),
      ...(help !== undefined && { help }),
    };
  }

  #with(changes: Partial<PossibleAnswerSettings<Questions, Cibles, Faits>>) {
    return new DeclaredPossibleAnswer({ ...this.#settings, ...changes });
  }
}

/**
 * Les réponses possibles d'une question, dans l'ordre déclaré, ou dans celui
 * que le modèle choisit. L'ordre ne retire rien : une réponse possible hors de
 * l'ordre se règle encore, et peut servir de réponse possible exclusive.
 */
export class DeclaredPossibleAnswers<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
> {
  readonly #options: readonly DeclaredPossibleAnswer<
    Questions,
    Cibles,
    Faits
  >[];
  readonly #order: readonly string[] | undefined;

  /**
   * Les réponses possibles d'une table de libellés : chaque clé devient la
   * valeur d'une réponse possible, dans l'ordre des clés. JavaScript range une
   * clé qui a l'air d'un entier (`"1"`, `"2"`) avant les autres, ce qui
   * changerait cet ordre sans rien dire : une telle clé est refusée. Préfixe-la
   * d'un mot.
   */
  static of<Questions extends AnyQuestions, Cibles, Faits>(
    labels: Readonly<Record<string, string>>,
  ): DeclaredPossibleAnswers<Questions, Cibles, Faits> {
    return new DeclaredPossibleAnswers(
      possibleAnswersOf<Questions, Cibles, Faits>(labels),
    );
  }

  private constructor(
    possibleAnswers: readonly DeclaredPossibleAnswer<
      Questions,
      Cibles,
      Faits
    >[],
    order?: readonly string[],
  ) {
    this.#options = possibleAnswers;
    this.#order = order;
  }

  /** Le libellé déclaré de chaque réponse possible, par valeur. */
  get labels(): Readonly<Record<string, string>> {
    return Object.fromEntries(
      this.#options.map(({ value, label }) => [value, label]),
    );
  }

  /** Ce que lisent les gardes de toutes ses réponses possibles. */
  get guardReads(): Reads {
    return Reads.union(...this.#options.map(({ guardReads }) => guardReads));
  }

  /** Les mêmes, la réponse possible `value` réglée par `settle`. */
  settled(
    value: string,
    settle: (
      possibleAnswer: DeclaredPossibleAnswer<Questions, Cibles, Faits>,
    ) => DeclaredPossibleAnswer<Questions, Cibles, Faits>,
  ): DeclaredPossibleAnswers<Questions, Cibles, Faits> {
    const possibleAnswers = this.#options.map((possibleAnswer) =>
      possibleAnswer.value === value ? settle(possibleAnswer) : possibleAnswer,
    );
    return new DeclaredPossibleAnswers(possibleAnswers, this.#order);
  }

  /** Les mêmes, proposées seulement pour `values`, dans cet ordre. */
  ordered(
    values: readonly string[],
  ): DeclaredPossibleAnswers<Questions, Cibles, Faits> {
    return new DeclaredPossibleAnswers(this.#options, values);
  }

  /**
   * Les réponses possibles qui se proposent, hors `except`, sous leur libellé
   * du moment.
   */
  offeredIn(
    context: Context<Questions, Cibles, Faits>,
    except?: string,
  ): OfferedPossibleAnswer[] {
    const values = this.#order ?? this.#options.map(({ value }) => value);
    return values
      .filter((value) => value !== except)
      .flatMap((value) => this.offeredOneIn(value, context) ?? []);
  }

  /** La réponse possible `value`, si elle se propose. */
  offeredOneIn(
    value: string,
    context: Context<Questions, Cibles, Faits>,
  ): OfferedPossibleAnswer | NotOffered {
    const possibleAnswer = this.#options.find((each) => each.value === value);
    return possibleAnswer?.offeredIn(context);
  }
}

// ---- implémentation ----

type Context<Questions extends AnyQuestions, Cibles, Faits> = QuestionContext<
  Questions,
  Cibles,
  Faits
>;

// Ce qu'une réponse possible déclarée règle.
type PossibleAnswerSettings<Questions extends AnyQuestions, Cibles, Faits> = {
  readonly value: string;
  readonly label: string;
  readonly conditions: readonly Condition[];
  readonly description?: string;
  readonly blocks?: string;
  labelFrom?(context: Context<Questions, Cibles, Faits>): string;
  helpFrom?(
    context: Context<Questions, Cibles, Faits>,
  ): PossibleAnswerHelp | NoHelp;
};

function possibleAnswersOf<Questions extends AnyQuestions, Cibles, Faits>(
  labels: Readonly<Record<string, string>>,
): DeclaredPossibleAnswer<Questions, Cibles, Faits>[] {
  const values = Object.keys(labels);
  const integer = values.find((value) => /^(0|[1-9]\d*)$/.test(value));
  if (integer !== undefined) {
    throw new QuestionnaireDeclarationError(
      `« ${integer} » a l'air d'un entier : il passerait avant les autres options.`,
    );
  }
  return values.map(
    (value) =>
      new DeclaredPossibleAnswer({
        value,
        label: labels[value] ?? value,
        conditions: [],
      }),
  );
}
