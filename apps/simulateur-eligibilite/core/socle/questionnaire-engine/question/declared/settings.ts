// Ce que toute question déclarée règle, quelle que soit sa sorte. La question
// les tient, et en tire ce qui se lit autour du champ quand elle se pose
// (`question/declared/question.vo.ts`).

import type { Condition } from "../../conditions/condition.ts";
import type { ShownUnder } from "../asked/common.vo.ts";
import type { Pipeline, QuestionContext } from "../asked/context.vo.ts";
import type { Dependency } from "../dependency.vo.ts";
import type { AnyQuestions, Reminder } from "../question.ts";
import type { Inconsistencies } from "./inconsistencies.vo.ts";

/** Rien de calculé : le rappel fixe de `reminder` vaut. */
export type NothingComputed = undefined;

/** Ce que toute question déclarée règle, quelle que soit sa sorte. */
export type CommonSettings<Questions extends AnyQuestions, Cibles, Faits> = {
  readonly id: string;
  readonly label: string;
  /** Ce qui calcule les faits et les cibles que lisent ses conditions. */
  readonly pipeline: Pipeline<Faits, Cibles>;
  readonly conditions: readonly Condition[];
  readonly inconsistencies: Inconsistencies;
  readonly dependsOn: readonly Dependency[];
  readonly hint?: string;
  readonly reminder?: Reminder;
  readonly optional?: boolean;
  /** Facultative, sauf quand cette condition tient (`requiredWhen`). */
  readonly requiredWhen?: Condition;
  readonly alwaysAsked?: boolean;
  /** Une place suivante : la question y est déjà déclarée plus tôt. */
  readonly laterPlace?: boolean;
  readonly under?: ShownUnder;
  labelFrom?(context: QuestionContext<Questions, Cibles, Faits>): string;
  hintFrom?(context: QuestionContext<Questions, Cibles, Faits>): string;
  reminderFrom?(
    context: QuestionContext<Questions, Cibles, Faits>,
  ): Reminder | NothingComputed;
};
