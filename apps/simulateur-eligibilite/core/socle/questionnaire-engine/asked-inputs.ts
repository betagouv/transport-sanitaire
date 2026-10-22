// Les saisies libres telles qu'elles se posent : un nombre, un texte, une
// date, une case seule. Chacune dit ce qui ne va pas dans sa saisie.

import { type AnswerProblem, MISSING } from "./answer-problem.ts";
import { AskedCommon, type AskedCommonData } from "./asked-common.ts";
import type { Answer, Unanswered } from "./question.ts";

export type AskedNumberData = AskedCommonData & {
  readonly kind: "number";
  readonly min?: number;
  readonly max?: number;
  readonly integer?: boolean;
  readonly unit?: string;
};

/** Un nombre, tel qu'il se demande. */
export class AskedNumber extends AskedCommon {
  readonly kind = "number";
  readonly min: number | undefined;
  readonly max: number | undefined;
  /** N'accepte qu'un nombre entier : une décimale est refusée. */
  readonly integer: boolean;
  readonly unit: string | undefined;

  constructor(data: AskedNumberData) {
    super(data);
    this.min = data.min;
    this.max = data.max;
    this.integer = data.integer ?? false;
    this.unit = data.unit;
  }

  protected override formatProblemOf(
    answer: Answer,
  ): AnswerProblem | undefined {
    if (typeof answer !== "number" || !Number.isFinite(answer))
      return { kind: "not a number" };
    if (this.integer && !Number.isInteger(answer))
      return { kind: "not an integer" };
    const { min, max } = this;
    if (min !== undefined && answer < min) return { kind: "number below", min };
    if (max !== undefined && answer > max) return { kind: "number above", max };
    return undefined;
  }
}

export type AskedTextData = AskedCommonData & {
  readonly kind: "text" | "long text";
};

/** Un texte, sur une ligne ou sur plusieurs. */
export class AskedText extends AskedCommon {
  readonly kind: "text" | "long text";

  constructor(data: AskedTextData) {
    super(data);
    this.kind = data.kind;
  }

  protected override formatProblemOf(answer: Answer) {
    return typeof answer === "string" && answer.trim() !== ""
      ? undefined
      : MISSING;
  }
}

export type AskedDateData = AskedCommonData & {
  readonly kind: "date" | "datetime";
  readonly min?: string;
  readonly max?: string;
};

/**
 * Une date, ou une date et une heure, entre ses bornes du moment. Les bornes
 * s'écrivent comme la réponse, au format ISO : l'ordre des textes est alors
 * celui des dates.
 */
export class AskedDate extends AskedCommon {
  readonly kind: "date" | "datetime";
  readonly min: string | undefined;
  readonly max: string | undefined;

  constructor(data: AskedDateData) {
    super(data);
    this.kind = data.kind;
    this.min = data.min;
    this.max = data.max;
  }

  protected override formatProblemOf(
    answer: Answer,
  ): AnswerProblem | undefined {
    if (typeof answer !== "string" || answer.trim() === "") return MISSING;
    const { min, max } = this;
    if (min !== undefined && answer < min) return { kind: "date before", min };
    if (max !== undefined && answer > max) return { kind: "date after", max };
    return undefined;
  }
}

export type AskedCheckboxData = AskedCommonData & {
  readonly kind: "checkbox";
  readonly box: string;
};

/**
 * Une case seule, sous son libellé. Sa réponse est `true` ou `false` : elle
 * n'a rien d'autre à garder, ni rien à corriger.
 */
export class AskedCheckbox extends AskedCommon {
  readonly kind = "checkbox";
  /** Le texte de la case. */
  readonly box: string;

  constructor(data: AskedCheckboxData) {
    super(data);
    this.box = data.box;
  }

  override kept(answer: Answer | Unanswered): Answer | Unanswered {
    return typeof answer === "boolean" ? answer : undefined;
  }
}
