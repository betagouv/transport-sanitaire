// Le contexte où se lisent les conditions d'une question : les réponses des
// questions d'avant elle, à sa place (`guard-place.vo.ts`), leurs faits et
// leurs cibles. Le service vérifie aussi, avant toute lecture, qu'aucune de ses
// conditions ne lit une question suivante.

import {
  type Pipeline,
  QuestionContext,
  type SeenAnswers,
} from "../question/asked/context.vo.ts";
import type { AnyQuestions } from "../question/question.types.ts";
import type { Condition, Reading } from "./reading.vo.ts";

/** Les conditions qu'une question déclare, et ce qui calcule ce qu'elles lisent. */
type Guards<Faits, Cibles> = {
  readonly pipeline: Pipeline<Faits, Cibles>;
  readonly conditions: readonly Condition[];
  /** Les incohérences : ce qu'elles lisent, réponses à revoir comprises. */
  readonly inconsistencies: { readonly guards: readonly Reading<unknown>[] };
  readonly requiredWhen?: Condition;
  /** Les places de la question sous une réponse, et ce qui les restreint. */
  readonly under?: { readonly conditions: readonly Condition[] };
};

export class GuardReadingService<Faits, Cibles> {
  readonly #guards: Guards<Faits, Cibles>;

  constructor(guards: Guards<Faits, Cibles>) {
    this.#guards = guards;
  }

  /**
   * Lit d'avance chaque question que citent les conditions, celles de ses
   * places sous une réponse, les incohérences, les réponses qu'elles invitent
   * à revoir et ce qui rend la réponse obligatoire. Une question suivante
   * arrête tout, même si la condition est fausse : sans ça, l'erreur ne se
   * verrait que dans certains parcours.
   */
  checkReads<Questions extends AnyQuestions>(
    seen: SeenAnswers<Questions, Cibles | undefined>,
    earlier: SeenAnswers<Questions, Cibles | undefined>,
  ): void {
    const { conditions, inconsistencies, requiredWhen, under } = this.#guards;
    const places = under?.conditions ?? [];
    for (const id of readIds([...conditions, ...places])) seen.answer(id);
    const required = requiredWhen ? [requiredWhen] : [];
    for (const id of readIds([...inconsistencies.guards, ...required]))
      earlier.answer(id);
  }

  /** Le contexte de la question, vu ces réponses. */
  contextOf<Questions extends AnyQuestions>(
    seen: SeenAnswers<Questions, Cibles | undefined>,
  ): QuestionContext<Questions, Cibles, Faits> {
    return new QuestionContext(seen, this.#guards.pipeline);
  }
}

// ---- implémentation ----

function readIds(guards: readonly Reading<unknown>[]): string[] {
  return guards.flatMap((guard) => guard.reads.questions);
}
