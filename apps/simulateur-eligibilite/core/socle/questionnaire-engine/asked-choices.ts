// Les questions à choix telles qu'elles se posent : avec les seules options
// qui se proposent, sous leur libellé du moment. Une réponse n'en garde que ces
// options, et l'une d'elles peut bloquer le questionnaire.

import {
  type AnswerProblem,
  MISSING,
  type NoError,
  stated,
} from "./answer-problem.ts";
import { AskedCommon, type AskedCommonData } from "./asked-common.ts";
import type { OfferedOption } from "./option.ts";
import type { Answer, IncompatibleOptions, Unanswered } from "./question.ts";

export type AskedSingleChoiceData = AskedCommonData & {
  readonly kind: "single choice";
  readonly options: readonly OfferedOption[];
  readonly dropdown?: boolean;
};

/** Un choix unique, tel qu'il se pose. */
export class AskedSingleChoice extends AskedCommon {
  readonly kind = "single choice";
  readonly options: readonly OfferedOption[];
  /** Affiché en liste déroulante, et non en boutons radio. */
  readonly dropdown: boolean;

  constructor(data: AskedSingleChoiceData) {
    super(data);
    this.options = data.options;
    this.dropdown = data.dropdown ?? false;
  }

  override kept(answer: Answer | Unanswered): Answer | Unanswered {
    return typeof answer === "string" && this.offeredValues().includes(answer)
      ? answer
      : undefined;
  }

  override offeredValues(): readonly string[] {
    return this.options.map((option) => option.value);
  }

  protected override formatProblemOf(answer: Answer) {
    if (typeof answer !== "string" || answer.trim() === "") return MISSING;
    return blockOf(this.options, [answer]);
  }
}

export type AskedMultipleChoiceData = AskedCommonData & {
  readonly kind: "multiple choice";
  readonly options: readonly OfferedOption[];
  readonly exclusiveOption?: OfferedOption;
  readonly incompatibleOptions?: readonly IncompatibleOptions[];
};

/** Un choix multiple, tel qu'il se pose. */
export class AskedMultipleChoice extends AskedCommon {
  readonly kind = "multiple choice";
  readonly options: readonly OfferedOption[];
  /** La cocher décoche les autres. Absente : elle ne se propose pas. */
  readonly exclusiveOption: OfferedOption | undefined;
  /** Les options qui s'excluent deux à deux. */
  readonly incompatibleOptions: readonly IncompatibleOptions[];

  constructor(data: AskedMultipleChoiceData) {
    super(data);
    this.options = data.options;
    this.exclusiveOption = data.exclusiveOption;
    this.incompatibleOptions = data.incompatibleOptions ?? [];
  }

  override kept(answer: Answer | Unanswered): Answer | Unanswered {
    if (!Array.isArray(answer)) return answer;
    const values = this.offeredValues();
    const offered = answer.filter((value) => values.includes(value));
    return offered.length > 0 ? offered : undefined;
  }

  override offeredValues(): readonly string[] {
    const exclusive = this.exclusiveOption ? [this.exclusiveOption] : [];
    return [...this.options, ...exclusive].map((option) => option.value);
  }

  protected override formatProblemOf(answer: Answer) {
    if (!Array.isArray(answer) || answer.length === 0)
      return { kind: "nothing checked" } as const;
    return this.#incompatibilityOf(answer) ?? blockOf(this.options, answer);
  }

  // L'écran ne laisse pas cocher deux options incompatibles. Ceci couvre une
  // réponse venue d'ailleurs, comme une seed.
  #incompatibilityOf(checked: readonly string[]): AnswerProblem | NoError {
    const incompatible = this.incompatibleOptions.find(({ values }) =>
      values.every((value) => checked.includes(value)),
    );
    return incompatible && stated(incompatible.explanation);
  }
}

// ---- implémentation ----

// Le blocage de la première option choisie qui bloque, s'il y en a une.
function blockOf(
  options: readonly OfferedOption[],
  chosen: readonly string[],
): AnswerProblem | NoError {
  const blocking = options.find(
    (option) => option.blocks !== undefined && chosen.includes(option.value),
  );
  return blocking?.blocks === undefined ? undefined : stated(blocking.blocks);
}
