// Les pages d'une étape : celles qui posent au moins une question, dans l'ordre,
// et celles qui attendent encore une réponse. La simulation y cherche la page à
// ouvrir : au départ, après « Suivant », à une adresse.

import type { Answers, Page, Reading } from "../questionnaire-engine/index.ts";

/** Aucune page ne répond à la demande. */
type NoPage = undefined;

export class StagePages {
  /**
   * Les pages posées de cette lecture, à ces réponses. `within` : seulement
   * celles-ci, après le verrou celles du complément.
   */
  static of(
    reading: Reading,
    answers: Answers,
    within?: readonly Page[],
  ): StagePages {
    const asked = reading.askedPages();
    const list = within ? asked.filter((page) => within.includes(page)) : asked;
    return new StagePages(list, reading, answers);
  }

  /** Les pages, dans l'ordre. */
  readonly list: readonly Page[];
  readonly #reading: Reading;
  readonly #answers: Answers;

  private constructor(
    list: readonly Page[],
    reading: Reading,
    answers: Answers,
  ) {
    this.list = list;
    this.#reading = reading;
    this.#answers = answers;
  }

  /** Cette page attend-elle encore une réponse ? */
  isPending(page: Page): boolean {
    return this.#reading
      .questionsOn(page)
      .some((question) => !question.isAnsweredBy(this.#answers[question.id]));
  }

  /** La première page qui attend une réponse. */
  firstPending(): Page | NoPage {
    return this.list.find((page) => this.isPending(page));
  }

  /**
   * La page où se trouverait un prescripteur ayant donné ces réponses : la
   * première qui attend une réponse, sinon la dernière.
   */
  current(): Page | NoPage {
    return this.firstPending() ?? this.list.at(-1);
  }

  includes(page: Page): boolean {
    return this.list.includes(page);
  }

  /** La page qui précède celle-ci. Aucune sur la première. */
  before(page: Page): Page | NoPage {
    const index = this.list.indexOf(page);
    return index > 0 ? this.list[index - 1] : undefined;
  }

  /**
   * Les pages où l'on peut aller sans rien répondre de plus : jusqu'à la
   * première qui attend une réponse, elle comprise.
   */
  reachable(): readonly Page[] {
    const first = this.list.findIndex((page) => this.isPending(page));
    return first === -1 ? this.list : this.list.slice(0, first + 1);
  }
}
