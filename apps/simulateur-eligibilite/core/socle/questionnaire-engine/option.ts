// Ce qu'est une option d'un choix : son libellé, ce qui la fait se proposer,
// son aide, et ce qu'elle bloque. Les questions à choix en portent la liste.

import type { GivenAnswers } from "./given-answers.ts";
import type { AnyCibles, AnyQuestions } from "./question.ts";
import type { ValidatedAnswers } from "./validated-answers.ts";

/**
 * L'aide d'une option : un intitulé qui se déplie sur une liste. La déplier
 * n'est pas répondre.
 */
type OptionHelp = {
  readonly label: string;
  readonly items: readonly string[];
};

export type Option<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> = {
  readonly value: string;
  readonly label: string;
  /** Le libellé, quand il dépend des réponses. Absente : `label`. */
  labelFrom?(
    answers: GivenAnswers<Questions>,
    cibles: Cibles,
    validated: ValidatedAnswers<Questions>,
  ): string;
  /** Ce que l'option veut dire, rendu sous son libellé. */
  readonly description?: string;
  /**
   * L'option se propose-t-elle, vu les réponses ? Absente : toujours. Une
   * réponse qui la portait la perd quand elle ne se propose plus.
   */
  offeredIf?(
    answers: GivenAnswers<Questions>,
    cibles: Cibles,
    validated: ValidatedAnswers<Questions>,
  ): boolean;
  /**
   * Choisir cette option arrête le questionnaire sur sa page : ce message
   * s'affiche, et on n'avance plus tant qu'elle reste choisie.
   */
  readonly blocks?: string;
  /** L'aide dépliable de l'option. */
  readonly help?: OptionHelp;
  /** L'aide, quand elle dépend des réponses. Absente : `help`. */
  helpFrom?(
    answers: GivenAnswers<Questions>,
    cibles: Cibles,
    validated: ValidatedAnswers<Questions>,
  ): OptionHelp | undefined;
};

/** Ce qu'une option porte en plus de sa valeur et de son libellé. */
type OptionDetails<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
> = Omit<Option<Questions, Cibles>, "value" | "label">;

/**
 * Fait les options d'une question à partir d'une table de libellés : chaque clé
 * devient la valeur d'une option, et son libellé la suit. `details` ajoute à
 * une option ce qu'elle porte de plus, par sa clé.
 *
 * Les options suivent l'ordre des clés. JavaScript range une clé qui a l'air
 * d'un entier (`"1"`, `"2"`) avant les autres, ce qui changerait cet ordre
 * sans rien dire : une telle clé est refusée. Préfixe-la d'un mot.
 */
export function optionsFrom<
  Value extends string,
  Questions extends AnyQuestions = AnyQuestions,
  Cibles = AnyCibles | undefined,
>(
  labels: Readonly<Record<Value, string>>,
  details: Partial<Record<Value, OptionDetails<Questions, Cibles>>> = {},
): Option<Questions, Cibles>[] {
  const values = Object.keys(labels) as Value[];
  const integer = values.find((value) => /^(0|[1-9]\d*)$/.test(value));
  if (integer !== undefined) {
    throw new Error(
      `« ${integer} » a l'air d'un entier : il passerait avant les autres options.`,
    );
  }
  return values.map((value) => ({
    value,
    label: labels[value],
    ...details[value],
  }));
}
