// Enregistre les réponses d'une page validée.
//
// Les réponses de la page sont remplacées. Celles qui dépendaient d'une réponse
// changée sont effacées, et elles seules.

import { isAddress } from "./address";
import type { Answer, Answers, Page, Unanswered } from "./question";

/**
 * Les réponses du questionnaire, une fois la page validée. `inputs` porte les
 * réponses de la page telles qu'à l'écran. Une question de la page absente
 * d'`inputs` perd sa réponse.
 */
export function commitPage(
  pages: readonly Page[],
  answers: Answers,
  page: Page,
  inputs: Answers,
): Answers {
  const onThePage = new Set(page.questions.map((question) => question.id));
  const changed = [...onThePage].filter(
    (id) => !sameAnswer(answers[id], inputs[id]),
  );
  const stale = dependentsOf(pages, changed);
  const kept = Object.entries(answers).filter(
    ([id]) => !onThePage.has(id) && !stale.has(id),
  );
  return { ...Object.fromEntries(kept), ...inputs };
}

// ---- implémentation ----

// De proche en proche : si B dépend de A et C de B, changer A efface B et C.
function dependentsOf(
  pages: readonly Page[],
  changed: readonly string[],
): Set<string> {
  const questions = pages.flatMap((page) => page.questions);
  const stale = new Set<string>();
  let frontier = changed;
  while (frontier.length > 0) {
    const next = questions
      .filter((question) => !stale.has(question.id))
      .filter((question) =>
        question.dependsOn?.some((id) => frontier.includes(id)),
      )
      .map((question) => question.id);
    for (const id of next) stale.add(id);
    frontier = next;
  }
  return stale;
}

function sameAnswer(a: Answer | Unanswered, b: Answer | Unanswered): boolean {
  return JSON.stringify(comparable(a)) === JSON.stringify(comparable(b));
}

// Une adresse est la même quel que soit l'ordre où ses champs sont écrits :
// une seed ne les range pas forcément comme l'écran.
function comparable(answer: Answer | Unanswered) {
  return isAddress(answer)
    ? Object.entries(answer).sort(([a], [b]) => a.localeCompare(b))
    : answer;
}
