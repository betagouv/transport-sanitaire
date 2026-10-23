// Les options d'une question à choix déclarée. Elles viennent du catalogue de
// l'éditeur, d'où viennent leurs valeurs et leurs libellés. Le modèle en règle
// chacune par une lambda, tous ses réglages au même endroit :
//
//   .option("6_SEANCE", (option) => option.description("…").offeredIf(…))
//
// Une option ne change pas : chaque réglage donne une copie.

import type { NotOffered, OfferedOption, OptionHelp } from "./option.ts";
import type { AnyQuestions } from "./question.ts";
import type { QuestionContext } from "./question-context.ts";

/** L'option n'a pas d'aide dans ce cas. */
type NoHelp = undefined;

/** Une option déclarée : son libellé, ce qui la fait se proposer, son aide. */
export class DeclaredOption<Questions extends AnyQuestions, Cibles, Faits> {
  readonly #settings: OptionSettings<Questions, Cibles, Faits>;

  constructor(settings: OptionSettings<Questions, Cibles, Faits>) {
    this.#settings = settings;
  }

  get value(): string {
    return this.#settings.value;
  }

  /** Ce que l'option veut dire, affiché sous son libellé. */
  description(description: string): DeclaredOption<Questions, Cibles, Faits> {
    return this.#with({ description });
  }

  /**
   * L'option se propose-t-elle, vu les réponses ? Chaque appel ajoute une
   * condition. Une réponse qui la portait la perd quand elle ne se propose
   * plus.
   */
  offeredIf(
    condition: (context: Context<Questions, Cibles, Faits>) => boolean,
  ): DeclaredOption<Questions, Cibles, Faits> {
    return this.#with({
      conditions: [...this.#settings.conditions, condition],
    });
  }

  /** Le libellé, quand il dépend des réponses. */
  labelFrom(
    label: (context: Context<Questions, Cibles, Faits>) => string,
  ): DeclaredOption<Questions, Cibles, Faits> {
    return this.#with({ labelFrom: label });
  }

  /**
   * Choisir cette option arrête le questionnaire sur sa page : ce message
   * s'affiche, et on n'avance plus tant qu'elle reste choisie.
   */
  blocks(message: string): DeclaredOption<Questions, Cibles, Faits> {
    return this.#with({ blocks: message });
  }

  /** L'aide dépliable de l'option, qui dépend des réponses. */
  helpFrom(
    help: (context: Context<Questions, Cibles, Faits>) => OptionHelp | NoHelp,
  ): DeclaredOption<Questions, Cibles, Faits> {
    return this.#with({ helpFrom: help });
  }

  /** L'option telle qu'elle se propose, si elle se propose. */
  offeredIn(
    context: Context<Questions, Cibles, Faits>,
  ): OfferedOption | NotOffered {
    const { value, description, blocks, conditions } = this.#settings;
    if (!conditions.every((condition) => condition(context))) return undefined;
    const help = this.#settings.helpFrom?.(context);
    return {
      value,
      label: this.#settings.labelFrom?.(context) ?? this.#settings.label,
      ...(description !== undefined && { description }),
      ...(blocks !== undefined && { blocks }),
      ...(help !== undefined && { help }),
    };
  }

  #with(changes: Partial<OptionSettings<Questions, Cibles, Faits>>) {
    return new DeclaredOption({ ...this.#settings, ...changes });
  }
}

/**
 * Les options d'une question, dans l'ordre du catalogue, ou dans celui que le
 * modèle choisit. L'ordre ne retire rien : une option hors de l'ordre se règle
 * encore, et peut servir d'option exclusive.
 */
export class DeclaredOptions<Questions extends AnyQuestions, Cibles, Faits> {
  readonly #options: readonly DeclaredOption<Questions, Cibles, Faits>[];
  readonly #order: readonly string[] | undefined;

  /**
   * Les options d'une table de libellés : chaque clé devient la valeur d'une
   * option, dans l'ordre des clés. JavaScript range une clé qui a l'air d'un
   * entier (`"1"`, `"2"`) avant les autres, ce qui changerait cet ordre sans
   * rien dire : une telle clé est refusée. Préfixe-la d'un mot.
   */
  static of<Questions extends AnyQuestions, Cibles, Faits>(
    labels: Readonly<Record<string, string>>,
  ): DeclaredOptions<Questions, Cibles, Faits> {
    return new DeclaredOptions(optionsOf<Questions, Cibles, Faits>(labels));
  }

  private constructor(
    options: readonly DeclaredOption<Questions, Cibles, Faits>[],
    order?: readonly string[],
  ) {
    this.#options = options;
    this.#order = order;
  }

  /** Les mêmes, l'option `value` réglée par `settle`. */
  settled(
    value: string,
    settle: (
      option: DeclaredOption<Questions, Cibles, Faits>,
    ) => DeclaredOption<Questions, Cibles, Faits>,
  ): DeclaredOptions<Questions, Cibles, Faits> {
    const options = this.#options.map((option) =>
      option.value === value ? settle(option) : option,
    );
    return new DeclaredOptions(options, this.#order);
  }

  /** Les mêmes, proposées seulement pour `values`, dans cet ordre. */
  ordered(
    values: readonly string[],
  ): DeclaredOptions<Questions, Cibles, Faits> {
    return new DeclaredOptions(this.#options, values);
  }

  /** Les options qui se proposent, hors `except`, sous leur libellé du moment. */
  offeredIn(
    context: Context<Questions, Cibles, Faits>,
    except?: string,
  ): OfferedOption[] {
    const values = this.#order ?? this.#options.map(({ value }) => value);
    return values
      .filter((value) => value !== except)
      .flatMap((value) => this.offeredOneIn(value, context) ?? []);
  }

  /** L'option `value`, si elle se propose. */
  offeredOneIn(
    value: string,
    context: Context<Questions, Cibles, Faits>,
  ): OfferedOption | NotOffered {
    const option = this.#options.find((each) => each.value === value);
    return option?.offeredIn(context);
  }
}

// ---- implémentation ----

type Context<Questions extends AnyQuestions, Cibles, Faits> = QuestionContext<
  Questions,
  Cibles,
  Faits
>;

// Ce qu'une option déclarée règle.
type OptionSettings<Questions extends AnyQuestions, Cibles, Faits> = {
  readonly value: string;
  readonly label: string;
  readonly conditions: readonly ((
    context: Context<Questions, Cibles, Faits>,
  ) => boolean)[];
  readonly description?: string;
  readonly blocks?: string;
  labelFrom?(context: Context<Questions, Cibles, Faits>): string;
  helpFrom?(context: Context<Questions, Cibles, Faits>): OptionHelp | NoHelp;
};

function optionsOf<Questions extends AnyQuestions, Cibles, Faits>(
  labels: Readonly<Record<string, string>>,
): DeclaredOption<Questions, Cibles, Faits>[] {
  const values = Object.keys(labels);
  const integer = values.find((value) => /^(0|[1-9]\d*)$/.test(value));
  if (integer !== undefined) {
    throw new Error(
      `« ${integer} » a l'air d'un entier : il passerait avant les autres options.`,
    );
  }
  return values.map(
    (value) =>
      new DeclaredOption({
        value,
        label: labels[value] ?? value,
        conditions: [],
      }),
  );
}
