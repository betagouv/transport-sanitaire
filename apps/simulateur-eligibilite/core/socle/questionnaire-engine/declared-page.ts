// Une page déclarée : son id, et ses questions dans l'ordre.
//
//   page("P2.2", question.singleChoice("Q2.2", "…"), question.number("Q2.3", "…"))
//
// Une condition de page s'ajoute à chacune de ses questions : une page dont
// aucune question ne se pose est sautée, sans rien de plus à déclarer.

import type { Condition } from "./condition.ts";
import type { DeclaredQuestion } from "./declared-question.ts";
import type { AnyQuestions } from "./question.ts";

/**
 * Une page déclarée. Elle ne change pas : `appliesWhen` et `mattersWhile`
 * donnent une copie.
 */
export class DeclaredPage<Questions extends AnyQuestions, Cibles, Faits> {
  readonly id: string;
  readonly questions: readonly AnyDeclared<Questions, Cibles, Faits>[];

  constructor(
    id: string,
    questions: readonly AnyDeclared<Questions, Cibles, Faits>[],
  ) {
    this.id = id;
    this.questions = questions;
  }

  /** La page a un sens quand `condition` tient : chaque question la reçoit. */
  appliesWhen(condition: Condition): DeclaredPage<Questions, Cibles, Faits> {
    const questions = this.questions.map((question) =>
      question.appliesWhen(condition),
    );
    return new DeclaredPage(this.id, questions);
  }

  /** La page est utile tant que `condition` tient : chaque question la reçoit. */
  mattersWhile(condition: Condition): DeclaredPage<Questions, Cibles, Faits> {
    const questions = this.questions.map((question) =>
      question.mattersWhile(condition),
    );
    return new DeclaredPage(this.id, questions);
  }
}

/** La page `id`, avec ces questions dans cet ordre. */
export function page<Questions extends AnyQuestions, Cibles, Faits>(
  id: string,
  ...questions: AnyDeclared<Questions, Cibles, Faits>[]
): DeclaredPage<Questions, Cibles, Faits> {
  return new DeclaredPage(id, questions);
}

// ---- implémentation ----

// Une question déclarée, de n'importe quelle sorte.
type AnyDeclared<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
> = DeclaredQuestion<Questions, Cibles, Faits, object>;
