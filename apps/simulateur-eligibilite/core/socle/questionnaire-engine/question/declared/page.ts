// Une page déclarée : son id, et ses questions dans l'ordre.
//
//   page("P2.2", question.singleChoice("Q2.2", "…"), question.number("Q2.3", "…"))
//
// Une condition de page s'ajoute à chacune de ses questions : une page dont
// aucune question ne se pose est sautée, sans rien de plus à déclarer.

import type { Condition } from "../../conditions/condition.ts";
import type { Answer, AnyQuestions } from "../question.ts";
import type { DeclaredQuestion } from "./question.ts";

/**
 * Une page déclarée. Elle ne change pas : `appliesWhen` et `mattersWhile`
 * donnent une copie.
 */
export class DeclaredPage<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
  Declared extends AnyDeclared<Questions, Cibles, Faits> = AnyDeclared<
    Questions,
    Cibles,
    Faits
  >,
> {
  readonly id: string;
  /** Ses questions, dans l'ordre : le type `Questions` du modèle s'en tire. */
  readonly questions: readonly Declared[];

  constructor(id: string, questions: readonly Declared[]) {
    this.id = id;
    this.questions = questions;
  }

  /** La page a un sens quand `condition` tient : chaque question la reçoit. */
  appliesWhen(
    condition: Condition,
  ): DeclaredPage<Questions, Cibles, Faits, Declared> {
    const questions = this.questions.map(
      (question) => question.appliesWhen(condition) as Declared,
    );
    return new DeclaredPage(this.id, questions);
  }

  /** La page est utile tant que `condition` tient : chaque question la reçoit. */
  mattersWhile(
    condition: Condition,
  ): DeclaredPage<Questions, Cibles, Faits, Declared> {
    const questions = this.questions.map(
      (question) => question.mattersWhile(condition) as Declared,
    );
    return new DeclaredPage(this.id, questions);
  }
}

/**
 * La page `id`, avec ces questions dans cet ordre. Une question qui s'affiche
 * sous une option (`shownUnder`) suit la liste de cette option, sur la page.
 */
export function page<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
  Declared extends readonly AnyDeclared<Questions, Cibles, Faits>[],
>(
  id: string,
  ...questions: Declared & readonly AnyDeclared<Questions, Cibles, Faits>[]
): DeclaredPage<Questions, Cibles, Faits, Declared[number]> {
  questions.forEach((question, rang) => {
    const parent = question.shownUnderQuestion;
    if (parent === undefined) return;
    if (!questions.slice(0, rang).some(({ id }) => id === parent))
      throw new Error(
        `${question.id} s'affiche sous ${parent}, qui ne la précède pas sur la page ${id}.`,
      );
  });
  return new DeclaredPage(id, questions);
}

// ---- implémentation ----

// Une question déclarée, de n'importe quelle sorte.
type AnyDeclared<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
> = DeclaredQuestion<Questions, Cibles, Faits, object, string, Answer>;
