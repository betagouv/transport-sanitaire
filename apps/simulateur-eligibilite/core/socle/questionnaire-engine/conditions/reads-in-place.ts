// Une question ne lit que les questions précédentes.
// Ce fichier lit leurs réponses, pour savoir si elle se pose.
// Il vérifie aussi qu'aucune condition ne lit une question suivante.

import {
  contextOf,
  type Pipeline,
  type QuestionContext,
  readingOf,
  type SeenAnswers,
} from "../question/asked/context.ts";
import type { AnyQuestions } from "../question/question.ts";
import type { Condition, Scope } from "./condition.ts";

// Ce que la question voit des questions précédentes.
// Leurs réponses, et ce que ses conditions en lisent.
type ReadAt<Questions extends AnyQuestions, Cibles, Faits> = {
  readonly context: QuestionContext<Questions, Cibles, Faits>;
  readonly scope: Scope;
};

export function readIn<Questions extends AnyQuestions, Cibles, Faits>(
  seen: SeenAnswers<Questions, Cibles | undefined>,
  pipeline: Pipeline<Faits, Cibles>,
): ReadAt<Questions, Cibles, Faits> {
  const context = contextOf(seen, pipeline);
  return { context, scope: readingOf(seen.answer, context, pipeline) };
}

// Lit d'avance chaque question que citent les conditions, les incohérences et
// ce qui rend la réponse obligatoire.
// Une question suivante arrête tout, même si la condition est fausse.
// Sans ça, l'erreur ne se verrait que dans certains parcours.
export function checkReads<Questions extends AnyQuestions, Cibles>(
  settings: {
    readonly conditions: readonly Condition[];
    readonly inconsistencies: readonly { readonly condition: Condition }[];
    readonly requiredWhen?: Condition;
  },
  seen: SeenAnswers<Questions, Cibles | undefined>,
  earlier: SeenAnswers<Questions, Cibles | undefined>,
) {
  const readIds = (guards: readonly Condition[]) =>
    guards.flatMap((guard) => guard.reads.questions);
  for (const id of readIds(settings.conditions)) seen.answer(id);
  const inconsistencies = settings.inconsistencies.map((i) => i.condition);
  const required = settings.requiredWhen ? [settings.requiredWhen] : [];
  for (const id of readIds([...inconsistencies, ...required]))
    earlier.answer(id);
}
