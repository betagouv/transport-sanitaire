// Les saisies libres telles qu'elles se posent : un nombre, un texte, une
// date, une case seule. Chacune dit ce qui ne va pas dans sa saisie.

import type { Answer, Unanswered } from "../question.ts";
import { type AnswerProblem, MISSING, type NoError } from "./answer-problem.ts";
import { AskedCommon, type AskedCommonData } from "./common.ts";

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

  protected override formatProblemOf(answer: Answer): AnswerProblem | NoError {
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

  protected override formatProblemOf(answer: Answer): AnswerProblem | NoError {
    if (typeof answer !== "string" || answer.trim() === "") return MISSING;
    if (!isRealDate(answer, this.kind)) return { kind: "invalid date" };
    const { min, max } = this;
    if (min !== undefined && answer < min) return { kind: "date before", min };
    if (max !== undefined && answer > max) return { kind: "date after", max };
    return undefined;
  }
}

export type AskedCheckboxData = AskedCommonData & {
  readonly kind: "checkbox";
  readonly box?: string;
};

/**
 * Une case seule, sous son libellé. Sa réponse est `true` ou `false` : elle
 * n'a rien d'autre à garder, ni rien à corriger.
 */
export class AskedCheckbox extends AskedCommon {
  readonly kind = "checkbox";
  /** Le texte de la case. Absent, le libellé est celui de la case. */
  readonly box?: string;

  constructor(data: AskedCheckboxData) {
    super(data);
    this.box = data.box;
  }

  override kept(answer: Answer | Unanswered): Answer | Unanswered {
    return typeof answer === "boolean" ? answer : undefined;
  }
}

// ---- implémentation ----

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_AND_TIME =
  /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

// Une date du calendrier, `AAAA-MM-JJ`, suivie de son heure pour une date et
// heure. `setUTCFullYear` garde les années à deux chiffres que le navigateur
// donne en cours de saisie (`0020`).
function isRealDate(answer: string, kind: "date" | "datetime"): boolean {
  const match = (kind === "date" ? DATE : DATE_AND_TIME).exec(answer);
  if (!match) return false;
  const [year, month, day] = match.slice(1, 4).map(Number) as [
    number,
    number,
    number,
  ];
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
