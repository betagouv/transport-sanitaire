// Enregistre les réponses d'une page validée.
//
// Les réponses de la page sont remplacées. Celles qui dépendaient d'une réponse
// changée sont effacées, et elles seules. Sur la page même, la saisie les
// efface déjà : leur champ se vide à l'écran.

import { isAddress } from "./question/address.ts";
import type { Answer, Answers, Page, Unanswered } from "./question/question.ts";

/**
 * Les réponses du questionnaire, une fois la page validée. `inputs` porte les
 * réponses de la page telles qu'à l'écran. Une question de la page absente
 * d'`inputs` perd sa réponse, sauf si elle attend une autre de ses places
 * (`waiting`, ADR-29) : elle n'a alors pas changé.
 */
export function commitPage(
  pages: readonly Page[],
  answers: Answers,
  page: Page,
  inputs: Answers,
  waiting: readonly string[] = [],
): Answers {
  const onThePage = new Set(
    page.questions
      .map((question) => question.id)
      .filter((id) => !waiting.includes(id)),
  );
  const changed = [...onThePage].filter(
    (id) => !sameAnswer(answers[id], inputs[id]),
  );
  const stale = dependentsOf(pages, changed);
  const kept = Object.entries(answers).filter(
    ([id]) => !onThePage.has(id) && !stale.has(id),
  );
  return { ...Object.fromEntries(kept), ...inputs };
}

/**
 * Le brouillon de la page après une saisie. Les questions de la page qui
 * dépendent de la réponse changée perdent la leur, de proche en proche. Une
 * case seule repart décochée.
 */
export function answerOnPage(
  page: Page,
  draft: Answers,
  id: string,
  answer: Answer | Unanswered,
): Answers {
  const { [id]: _replaced, ...others } = draft;
  const answered = answer === undefined ? others : { ...others, [id]: answer };
  if (sameAnswer(draft[id], answer)) return answered;
  const stale = dependentsOf([page], [id]);
  const unchecked = page.questions
    .filter((question) => stale.has(question.id))
    .filter((question) => question.kind === "checkbox")
    .map((question) => [question.id, false]);
  const kept = Object.entries(answered).filter(([other]) => !stale.has(other));
  return Object.fromEntries([...kept, ...unchecked]);
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
        question.dependencies.some((id) => frontier.includes(id)),
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
