// Ce dont dépend une réponse (`dependsOn`) : une question entière, ou certaines
// de ses réponses possibles seulement. Quand ce qu'on en voit change, la
// réponse s'efface (`validate-a-page.ts`).

import {
  type Answer,
  type AnyQuestions,
  idOf,
  type QuestionRef,
  type Unanswered,
} from "./question.ts";

/**
 * Ce que `dependsOn` reçoit : une question, ou une question et les réponses
 * possibles qui comptent. `{ question: Q1_3, options: SEANCES }` : cocher un
 * accident en plus ne change rien, cocher une autre séance efface la réponse.
 */
export type DependsOn<Questions extends AnyQuestions> =
  | QuestionRef<Questions>
  | {
      readonly question: QuestionRef<Questions>;
      readonly possibleAnswers: readonly string[];
    };

/**
 * Une question dont dépend une réponse, réduite au besoin à ces réponses
 * possibles.
 */
export class Dependency {
  static of<Questions extends AnyQuestions>(
    dependsOn: DependsOn<Questions>,
  ): Dependency {
    if (typeof dependsOn === "string" || !("question" in dependsOn)) {
      return new Dependency(idOf(dependsOn));
    }
    return new Dependency(idOf(dependsOn.question), dependsOn.possibleAnswers);
  }

  readonly id: string;
  readonly possibleAnswers?: readonly string[];

  private constructor(id: string, possibleAnswers?: readonly string[]) {
    this.id = id;
    if (possibleAnswers) this.possibleAnswers = possibleAnswers;
    Object.freeze(this);
  }

  /**
   * La réponse telle que la dépendance la voit : entière, ou réduite aux
   * réponses possibles qui comptent. Rien de coché parmi elles vaut une liste
   * vide.
   */
  seen(answer: Answer | Unanswered): Answer | Unanswered {
    const { possibleAnswers } = this;
    if (!possibleAnswers) return answer;
    const values = Array.isArray(answer) ? answer : [answer];
    return values.filter(
      (value): value is string =>
        typeof value === "string" && possibleAnswers.includes(value),
    );
  }
}
