// Les pages d'une étape : celles qui posent au moins une question, dans l'ordre,
// et celles qui attendent encore une réponse. La simulation y cherche la page à
// ouvrir : au départ, après « Suivant », à une adresse.

import type {
  AnsweredQuestionnaire,
  Page,
} from "../questionnaire-engine/index.ts";

/** Aucune page ne répond à la demande. */
type NoPage = undefined;

export class StagePages {
  /**
   * Les pages posées de ce questionnaire répondu. `within` : seulement
   * celles-ci, après le verrou celles du complément.
   */
  static of(
    reading: AnsweredQuestionnaire,
    within?: readonly Page[],
  ): StagePages {
    const asked = reading.askedPages();
    const list = within ? asked.filter((page) => within.includes(page)) : asked;
    return new StagePages(list, reading);
  }

  /** Les pages, dans l'ordre. */
  readonly list: readonly Page[];
  readonly #reading: AnsweredQuestionnaire;

  private constructor(list: readonly Page[], reading: AnsweredQuestionnaire) {
    this.list = list;
    this.#reading = reading;
  }

  /** Cette page attend-elle encore une réponse ? */
  isPending(page: Page): boolean {
    const { answers } = this.#reading;
    return this.#reading
      .questionsOn(page)
      .some((asked) => !asked.isAnsweredBy(answers.question(asked.id).value));
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

  /** La page d'avant `page` qui pose cette question. */
  asking(question: string, page: Page): Page | NoPage {
    const before = this.list.slice(0, Math.max(this.list.indexOf(page), 0));
    return before.find((earlier) =>
      this.#reading.questionsOn(earlier).some(({ id }) => id === question),
    );
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
