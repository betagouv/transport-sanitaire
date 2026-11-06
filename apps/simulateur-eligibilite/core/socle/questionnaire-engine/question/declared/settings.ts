// Ce que toute question déclarée règle, quelle que soit sa sorte, et ce que
// ces réglages donnent autour du champ quand elle se pose : le libellé, l'aide,
// le rappel, les incohérences et les réponses qu'elles invitent à revoir. La
// question les tient (`question/declared/question.ts`).

import {
  type Condition,
  type Scope,
  type Text,
  textIn,
  type Value,
} from "../../conditions/condition.ts";
import type { AskedCommonData, Revisit, ShownUnder } from "../asked/common.ts";
import type { Pipeline, QuestionContext } from "../asked/context.ts";
import type { AnyQuestions, Reminder } from "../question.ts";

/** Rien de calculé : le rappel fixe de `reminder` vaut. */
export type NothingComputed = undefined;

/** Ce que toute question déclarée règle, quelle que soit sa sorte. */
export type CommonSettings<Questions extends AnyQuestions, Cibles, Faits> = {
  readonly id: string;
  readonly label: string;
  /** Ce qui calcule les faits et les cibles que lisent ses conditions. */
  readonly pipeline: Pipeline<Faits, Cibles>;
  readonly conditions: readonly Condition[];
  readonly inconsistencies: readonly Inconsistency[];
  readonly dependsOn: readonly string[];
  readonly hint?: string;
  readonly reminder?: Reminder;
  readonly optional?: boolean;
  /** Facultative, sauf quand cette condition tient (`requiredWhen`). */
  readonly requiredWhen?: Condition;
  readonly alwaysAsked?: boolean;
  readonly under?: ShownUnder;
  labelFrom?(context: QuestionContext<Questions, Cibles, Faits>): string;
  hintFrom?(context: QuestionContext<Questions, Cibles, Faits>): string;
  reminderFrom?(
    context: QuestionContext<Questions, Cibles, Faits>,
  ): Reminder | NothingComputed;
};

/**
 * Une incohérence : sa condition, le message qui dit quoi corriger, et les
 * réponses d'avant qu'elle invite à revoir.
 */
type Inconsistency = {
  readonly condition: Condition;
  readonly message: Text;
  readonly revisit?: Value<readonly Revisit[]>;
};

// Ce qui se lit autour du champ, vu les réponses : le libellé, le rappel, s'il
// peut rester vide, les incohérences et les réponses à revoir.
export function commonIn<Questions extends AnyQuestions, Cibles, Faits>(
  settings: CommonSettings<Questions, Cibles, Faits>,
  context: QuestionContext<Questions, Cibles, Faits>,
  earlier: Scope,
): AskedCommonData {
  const inconsistent = settings.inconsistencies.filter(({ condition }) =>
    condition.in(earlier),
  );
  return {
    id: settings.id,
    label: settings.labelFrom?.(context) ?? settings.label,
    hint: settings.hintFrom?.(context) ?? settings.hint,
    reminder: settings.reminderFrom?.(context) ?? settings.reminder,
    optional: settings.optional === true && !settings.requiredWhen?.in(earlier),
    under: settings.under,
    inconsistencies: inconsistent.map(({ message }) =>
      textIn(message, earlier),
    ),
    revisits: revisitsOf(inconsistent, earlier),
  };
}

// ---- implémentation ----

// Les réponses à revoir, chacune une fois, dans l'ordre où les incohérences
// les donnent.
function revisitsOf(
  inconsistent: readonly Inconsistency[],
  earlier: Scope,
): readonly Revisit[] {
  const all = inconsistent.flatMap(({ revisit }) => revisit?.in(earlier) ?? []);
  return all.filter(
    (revisit, index) =>
      all.findIndex(({ question }) => question === revisit.question) === index,
  );
}
