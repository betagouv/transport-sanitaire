// Un affichage de page : une page du modèle, que le simulateur ouvre une fois.
// Ses questions y sont exposées à leur apparition, sous un id qu'il donne : un
// rendu de plus ne change rien. Voir docs/knowledge/adr/analytics.md, ADR-8.

import {
  type AnalyticsEvent,
  type Milestone,
  PHASES,
  type Phase,
  SCREENS,
  type Screen,
} from "../../../shared/analytics/analytics-event";

/** La page que le simulateur ouvre : sa partie, sa place, ses questions. */
export type OpenedPage = {
  readonly id: string;
  /** L'id de la partie du modèle qui la range. */
  readonly part: string;
  /** La première, la dernière des pages qui se posent dans sa partie. */
  readonly first: boolean;
  readonly last: boolean;
  /** Les questions affichées, dans l'ordre. */
  readonly questions: readonly string[];
};

/** Ce qu'un événement dit d'une question de l'affichage. */
export type AboutAQuestion = Pick<
  AnalyticsEvent,
  "screen" | "question_id" | "page_id" | "page_view_id" | "exposure_id"
>;

/** La partie de la page n'est pas une phase : P0, ou un modèle de test. */
export type NotAPhase = null;

/** Aucune saisie encore sur l'affichage. */
type NoQuestion = null;

export class PageView {
  readonly id: string;
  readonly #page: OpenedPage;
  readonly #exposed = new Set<string>();
  #interacted: string | NoQuestion = null;

  constructor(id: string, page: OpenedPage) {
    this.id = id;
    this.#page = page;
  }

  get part(): string {
    return this.#page.part;
  }

  get phase(): Phase | NotAPhase {
    return PHASES.find((phase) => phase === this.#page.part) ?? null;
  }

  /** Les jalons de la page dans sa phase. Hors d'une phase : aucun. */
  get milestones(): Milestone[] {
    if (!this.phase) return [];
    const { first, last } = this.#page;
    return [
      ...(first ? ["first" as const] : []),
      ...(last ? ["last" as const] : []),
    ];
  }

  /** Les questions qui apparaissent : celles qui n'y étaient pas encore. */
  expose(questions: readonly string[]): readonly string[] {
    const appearing = questions.filter(
      (question) => !this.#exposed.has(question),
    );
    for (const question of appearing) this.#exposed.add(question);
    return appearing;
  }

  /** La saisie passe à cette question : vrai si elle en change. */
  interact(question: string): boolean {
    if (this.#interacted === question) return false;
    this.#interacted = question;
    return true;
  }

  about(question: string): AboutAQuestion {
    return {
      screen: SCREENS.find((screen): screen is Screen => screen === this.part),
      question_id: question,
      page_id: this.#page.id,
      page_view_id: this.id,
      exposure_id: `${this.id}:${question}`,
    };
  }
}
