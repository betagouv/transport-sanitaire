// Enregistre les réponses d'une page validée, et le brouillon d'une page
// après une saisie.
//
// Les réponses de la page sont remplacées. Celles qui dépendaient d'une réponse
// changée sont effacées, et elles seules. Sur la page même, la saisie les
// efface déjà : leur champ se vide à l'écran.

import { Address } from "./question/address.vo.ts";
import type { Dependency } from "./question/dependency.vo.ts";
import type {
  Answer,
  Answers,
  Page,
  Unanswered,
} from "./question/question.types.ts";

/** Les réponses des pages d'un questionnaire, page par page. */
export class PageCommitService {
  readonly #pages: readonly Page[];

  /** `pages` : celles dont les questions peuvent dépendre d'une réponse. */
  constructor(pages: readonly Page[]) {
    this.#pages = pages;
  }

  /**
   * Les réponses du questionnaire, une fois la page validée. `inputs` porte
   * les réponses de la page telles qu'à l'écran. Une question de la page
   * absente d'`inputs` perd sa réponse, sauf si elle attend une autre de ses
   * places (`waiting`) : elle n'a alors pas changé.
   */
  commit(
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
    const stale = dependentsOf(this.#pages, answers, inputs, changed);
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
  answerOn(
    page: Page,
    draft: Answers,
    id: string,
    answer: Answer | Unanswered,
  ): Answers {
    const { [id]: _replaced, ...others } = draft;
    const answered =
      answer === undefined ? others : { ...others, [id]: answer };
    if (sameAnswer(draft[id], answer)) return answered;
    const stale = dependentsOf([page], draft, answered, [id]);
    return this.forget(page, answered, stale);
  }

  /**
   * Ce brouillon de la page, sans les réponses de ces questions. Une case
   * seule repart décochée.
   */
  forget(page: Page, draft: Answers, forgotten: ReadonlySet<string>): Answers {
    const unchecked = page.questions
      .filter((question) => forgotten.has(question.id))
      .filter((question) => question.kind === "checkbox")
      .map((question) => [question.id, false]);
    const kept = Object.entries(draft).filter(([id]) => !forgotten.has(id));
    return Object.fromEntries([...kept, ...unchecked]);
  }
}

// ---- implémentation ----

// De proche en proche : si B dépend de A et C de B, changer A efface B et C.
// Une réponse effacée compte comme absente pour celles qui en dépendent.
function dependentsOf(
  pages: readonly Page[],
  before: Answers,
  after: Answers,
  changed: readonly string[],
): Set<string> {
  const questions = pages.flatMap((page) => page.questions);
  const stale = new Set<string>();
  const seenAfter = (id: string) => (stale.has(id) ? undefined : after[id]);
  const differs = (dependency: Dependency) =>
    !sameAnswer(
      dependency.seen(before[dependency.id]),
      dependency.seen(seenAfter(dependency.id)),
    );
  let frontier = changed;
  while (frontier.length > 0) {
    const next = questions
      .filter((question) => !stale.has(question.id))
      .filter((question) =>
        question.dependencies.some(
          (d) => frontier.includes(d.id) && differs(d),
        ),
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
  const address = Address.of(answer);
  return address
    ? Object.entries(address.toJSON()).sort(([a], [b]) => a.localeCompare(b))
    : answer;
}
