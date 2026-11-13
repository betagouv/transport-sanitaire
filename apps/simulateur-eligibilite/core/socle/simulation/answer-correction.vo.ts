// Corriger une réponse d'avant depuis une alerte (NAV-LIEUX-CORRECTION-001,
// ADR-30) : un lien rouvre la page de la réponse à revoir, et « Suivant »
// ramène vers la page qui portait l'alerte. La simulation tient la correction
// en cours (`Simulation.revisit`) ; elle dit où elle reprend.

import type { Answers, Page, Reading } from "../questionnaire-engine/index.ts";
import { PageOpening, type StageEnds } from "./page-opening.vo.ts";
import type { StagePages } from "./stage-pages.vo.ts";

/**
 * Une correction en cours : la page qui portait l'alerte, son brouillon, et
 * son rang quand la correction a commencé.
 */
export class AnswerCorrection {
  readonly origin: Page;
  readonly draft: Answers;
  readonly returnTo: number;

  constructor(origin: Page, draft: Answers, returnTo: number) {
    this.origin = origin;
    this.draft = draft;
    this.returnTo = returnTo;
  }

  /**
   * Où elle reprend une fois validée, sur ces pages relues. D'abord une
   * question devenue nécessaire sur une page d'avant l'origine (`declared` dit
   * l'ordre des pages) : la correction continue. Sinon la page d'origine, si
   * elle se pose encore, avec son brouillon relu (`Reading.restore`). Si elle
   * ne se pose plus, la page qui attend une réponse. Aucune : l'étape
   * s'achève.
   */
  resumeOn(
    pages: StagePages,
    reading: Reading,
    declared: readonly Page[],
  ): PageOpening | StageEnds {
    const pending = pages.firstPending();
    const { origin } = this;
    if (pending && declared.indexOf(pending) < declared.indexOf(origin))
      return new PageOpening(pending, this);
    if (pages.includes(origin))
      return new PageOpening(
        origin,
        undefined,
        reading.restore(origin, this.draft),
      );
    return pending && new PageOpening(pending);
  }
}
