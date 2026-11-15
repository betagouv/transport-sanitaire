// Les questions à choix telles qu'elles se posent : avec les seules options
// qui se proposent, sous leur libellé du moment. Une réponse n'en garde que ces
// options, et l'une d'elles peut bloquer le questionnaire.

import type { OfferedPossibleAnswer } from "../possible-answer.ts";
import type {
  Answer,
  IncompatiblePossibleAnswers,
  Unanswered,
} from "../question.ts";
import {
  type AnswerProblem,
  MISSING,
  type NoError,
  stated,
} from "./answer-problem.vo.ts";
import { AskedCommon, type AskedCommonData } from "./common.vo.ts";

export type AskedSingleChoiceData = AskedCommonData & {
  readonly kind: "single choice";
  readonly possibleAnswers: readonly OfferedPossibleAnswer[];
  readonly dropdown?: boolean;
  readonly boldLabels?: boolean;
};

/** Un choix unique, tel qu'il se pose. */
export class AskedSingleChoice extends AskedCommon {
  readonly kind = "single choice";
  readonly possibleAnswers: readonly OfferedPossibleAnswer[];
  /** Affiché en liste déroulante, et non en boutons radio. */
  readonly dropdown: boolean;
  /** Les libellés des options en gras. */
  readonly boldLabels: boolean;

  constructor(data: AskedSingleChoiceData) {
    super(data);
    this.possibleAnswers = data.possibleAnswers;
    this.dropdown = data.dropdown ?? false;
    this.boldLabels = data.boldLabels ?? false;
  }

  override kept(answer: Answer | Unanswered): Answer | Unanswered {
    return typeof answer === "string" && this.offeredValues().includes(answer)
      ? answer
      : undefined;
  }

  override offeredValues(): readonly string[] {
    return this.possibleAnswers.map((possibleAnswer) => possibleAnswer.value);
  }

  protected override formatProblemOf(answer: Answer) {
    if (typeof answer !== "string" || answer.trim() === "") return MISSING;
    return blockOf(this.possibleAnswers, [answer]);
  }
}

export type AskedMultipleChoiceData = AskedCommonData & {
  readonly kind: "multiple choice";
  readonly possibleAnswers: readonly OfferedPossibleAnswer[];
  readonly exclusivePossibleAnswer?: OfferedPossibleAnswer;
  readonly incompatiblePossibleAnswers?: readonly IncompatiblePossibleAnswers[];
};

/** Un choix multiple, tel qu'il se pose. */
export class AskedMultipleChoice extends AskedCommon {
  readonly kind = "multiple choice";
  readonly possibleAnswers: readonly OfferedPossibleAnswer[];
  /** La cocher décoche les autres. Absente : elle ne se propose pas. */
  readonly exclusivePossibleAnswer: OfferedPossibleAnswer | undefined;
  /** Les options qui s'excluent deux à deux. */
  readonly incompatiblePossibleAnswers: readonly IncompatiblePossibleAnswers[];

  constructor(data: AskedMultipleChoiceData) {
    super(data);
    this.possibleAnswers = data.possibleAnswers;
    this.exclusivePossibleAnswer = data.exclusivePossibleAnswer;
    this.incompatiblePossibleAnswers = data.incompatiblePossibleAnswers ?? [];
  }

  override kept(answer: Answer | Unanswered): Answer | Unanswered {
    if (!Array.isArray(answer)) return answer;
    const values = this.offeredValues();
    const offered = answer.filter((value) => values.includes(value));
    return offered.length > 0 ? offered : undefined;
  }

  override offeredValues(): readonly string[] {
    const exclusive = this.exclusivePossibleAnswer
      ? [this.exclusivePossibleAnswer]
      : [];
    return [...this.possibleAnswers, ...exclusive].map(
      (possibleAnswer) => possibleAnswer.value,
    );
  }

  protected override formatProblemOf(answer: Answer) {
    if (!Array.isArray(answer) || answer.length === 0)
      return { kind: "nothing checked" } as const;
    return (
      this.#incompatibilityOf(answer) ?? blockOf(this.possibleAnswers, answer)
    );
  }

  // L'écran ne laisse pas cocher deux options incompatibles. Ceci couvre une
  // réponse venue d'ailleurs, comme une seed.
  #incompatibilityOf(checked: readonly string[]): AnswerProblem | NoError {
    const incompatible = this.incompatiblePossibleAnswers.find(({ values }) =>
      values.every((value) => checked.includes(value)),
    );
    return incompatible && stated(incompatible.explanation);
  }
}

// ---- implémentation ----

// Le blocage de la première option choisie qui bloque, s'il y en a une.
function blockOf(
  possibleAnswers: readonly OfferedPossibleAnswer[],
  chosen: readonly string[],
): AnswerProblem | NoError {
  const blocking = possibleAnswers.find(
    (possibleAnswer) =>
      possibleAnswer.blocks !== undefined &&
      chosen.includes(possibleAnswer.value),
  );
  return blocking?.blocks === undefined ? undefined : stated(blocking.blocks);
}
