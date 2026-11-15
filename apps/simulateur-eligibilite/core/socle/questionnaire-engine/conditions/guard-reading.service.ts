// Ce que les conditions d'une question voient des questions d'avant elle :
// leurs réponses à sa place (`guard-place.vo.ts`), les faits et les cibles de
// son contexte. Le service vérifie aussi, avant toute lecture, qu'aucune de ses
// conditions ne lit une question suivante.

import {
  contextOf,
  type Pipeline,
  type QuestionContext,
  readingOf,
  type SeenAnswers,
} from "../question/asked/context.ts";
import type { AnyQuestions } from "../question/question.ts";
import type { Condition, Scope, Value } from "./condition.ts";

/** Les conditions qu'une question déclare, et ce qui calcule ce qu'elles lisent. */
type Guards<Faits, Cibles> = {
  readonly pipeline: Pipeline<Faits, Cibles>;
  readonly conditions: readonly Condition[];
  /** Les incohérences : ce qu'elles lisent, réponses à revoir comprises. */
  readonly inconsistencies: { readonly guards: readonly Value<unknown>[] };
  readonly requiredWhen?: Condition;
};

/** Ce que la question voit des précédentes, et ce que ses conditions en lisent. */
type ReadAt<Questions extends AnyQuestions, Cibles, Faits> = {
  readonly context: QuestionContext<Questions, Cibles, Faits>;
  readonly scope: Scope;
};

export class GuardReadingService<Faits, Cibles> {
  readonly #guards: Guards<Faits, Cibles>;

  constructor(guards: Guards<Faits, Cibles>) {
    this.#guards = guards;
  }

  /**
   * Lit d'avance chaque question que citent les conditions, les incohérences,
   * les réponses qu'elles invitent à revoir et ce qui rend la réponse
   * obligatoire. Une question suivante arrête tout, même si la condition est
   * fausse : sans ça, l'erreur ne se verrait que dans certains parcours.
   */
  checkReads<Questions extends AnyQuestions>(
    seen: SeenAnswers<Questions, Cibles | undefined>,
    earlier: SeenAnswers<Questions, Cibles | undefined>,
  ): void {
    const { conditions, inconsistencies, requiredWhen } = this.#guards;
    for (const id of readIds(conditions)) seen.answer(id);
    const required = requiredWhen ? [requiredWhen] : [];
    for (const id of readIds([...inconsistencies.guards, ...required]))
      earlier.answer(id);
  }

  /** Ce que la question voit de ces réponses, et le périmètre de ses conditions. */
  readAt<Questions extends AnyQuestions>(
    seen: SeenAnswers<Questions, Cibles | undefined>,
  ): ReadAt<Questions, Cibles, Faits> {
    const { pipeline } = this.#guards;
    const context = contextOf(seen, pipeline);
    return { context, scope: readingOf(seen.answer, context, pipeline) };
  }
}

// ---- implémentation ----

function readIds(guards: readonly Value<unknown>[]): string[] {
  return guards.flatMap((guard) => guard.reads.questions);
}
