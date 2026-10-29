// Une question ne lit que les questions précédentes.
// Ce fichier lit leurs réponses, pour savoir si elle se pose.
// Il vérifie aussi qu'aucune condition ne lit une question suivante.

import type { Condition, Reading } from "./condition.ts";
import type { AnyQuestions } from "./question.ts";
import {
  contextOf,
  type Pipeline,
  type QuestionContext,
  readingOf,
  type SeenAnswers,
} from "./question-context.ts";

// Ce que la question voit des questions précédentes.
// Leurs réponses, et ce que ses conditions en lisent.
type ReadAt<Questions extends AnyQuestions, Cibles, Faits> = {
  readonly context: QuestionContext<Questions, Cibles, Faits>;
  readonly reading: Reading;
};

export function readIn<Questions extends AnyQuestions, Cibles, Faits>(
  seen: SeenAnswers<Questions, Cibles | undefined>,
  pipeline: Pipeline<Faits, Cibles>,
): ReadAt<Questions, Cibles, Faits> {
  const context = contextOf(seen, pipeline);
  return { context, reading: readingOf(seen.answer, context, pipeline) };
}

// Lit d'avance chaque question que citent les conditions et les incohérences.
// Une question suivante arrête tout, même si la condition est fausse.
// Sans ça, l'erreur ne se verrait que dans certains parcours.
export function checkReads<Questions extends AnyQuestions, Cibles>(
  settings: {
    readonly conditions: readonly Condition[];
    readonly inconsistencies: readonly { readonly condition: Condition }[];
  },
  seen: SeenAnswers<Questions, Cibles | undefined>,
  earlier: SeenAnswers<Questions, Cibles | undefined>,
) {
  const readIds = (guards: readonly Condition[]) =>
    guards.flatMap((guard) => guard.reads.questions);
  for (const id of readIds(settings.conditions)) seen.answer(id);
  const inconsistencies = settings.inconsistencies.map((i) => i.condition);
  for (const id of readIds(inconsistencies)) earlier.answer(id);
}
