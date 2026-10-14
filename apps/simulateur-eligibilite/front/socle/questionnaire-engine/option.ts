// Ce qu'est une option d'un choix : son libellé, ce qui la fait se proposer,
// son aide, et ce qu'elle bloque. Les questions à choix en portent la liste.

import type { Answers, AnyCibles, AnyQuestions, Validated } from "./question";

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
    answers: Answers<Questions>,
    cibles: Cibles,
    validated: Validated<Questions>,
  ): string;
  /** Ce que l'option veut dire, rendu sous son libellé. */
  readonly description?: string;
  /**
   * L'option se propose-t-elle, vu les réponses ? Absente : toujours. Une
   * réponse qui la portait la perd quand elle ne se propose plus.
   */
  offeredIf?(
    answers: Answers<Questions>,
    cibles: Cibles,
    validated: Validated<Questions>,
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
    answers: Answers<Questions>,
    cibles: Cibles,
    validated: Validated<Questions>,
  ): OptionHelp | undefined;
};
