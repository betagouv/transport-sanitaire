// Ce dont dépend une réponse (`dependsOn`) : une question entière, ou certaines
// de ses options seulement. Quand ce qu'on en voit change, la réponse s'efface
// (`validate-a-page.ts`).

import {
  type Answer,
  type AnyQuestions,
  type Dependency,
  idOf,
  type QuestionRef,
  type Unanswered,
} from "../question.ts";

/**
 * Ce que `dependsOn` reçoit : une question, ou une question et les options qui
 * comptent. `{ question: Q1_3, options: SEANCES }` : cocher un accident en plus
 * ne change rien, cocher une autre séance efface la réponse.
 */
export type DependsOn<Questions extends AnyQuestions> =
  | QuestionRef<Questions>
  | {
      readonly question: QuestionRef<Questions>;
      readonly options: readonly string[];
    };

export function dependencyOf<Questions extends AnyQuestions>(
  dependsOn: DependsOn<Questions>,
): Dependency {
  if (typeof dependsOn === "string" || !("question" in dependsOn)) {
    return { id: idOf(dependsOn) };
  }
  return { id: idOf(dependsOn.question), options: dependsOn.options };
}

/**
 * La réponse telle que la dépendance la voit : entière, ou réduite aux options
 * qui comptent. Rien de coché parmi elles vaut une liste vide.
 */
export function seenBy(
  dependency: Dependency,
  answer: Answer | Unanswered,
): Answer | Unanswered {
  const { options } = dependency;
  if (!options) return answer;
  const values = Array.isArray(answer) ? answer : [answer];
  return values.filter(
    (value): value is string =>
      typeof value === "string" && options.includes(value),
  );
}
