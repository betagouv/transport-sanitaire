// La position d'une simulation dans son parcours, en rangs (ADR-30) : de quoi
// la situer, dans l'adresse de la page par exemple, sans rien dire de ses
// réponses ni de ses pages. La simulation la donne (`Simulation.position`), et
// n'accepte d'y aller que vers une page déjà posée, avant le verrou
// (`Simulation.moveTo`).

import type { Page } from "../questionnaire-engine/index.ts";
import { AnswerCorrection } from "./answer-correction.vo.ts";
import { type KeptDraft, PageOpening } from "./page-opening.vo.ts";
import type { SimulationStage } from "./simulation-stage.vo.ts";
import type { StagePages } from "./stage-pages.vo.ts";

/** La simulation refuse d'aller là : elle reste où elle est. */
export type Refused = undefined;

/**
 * Un rang du parcours, compté depuis 1 : les pages du questionnaire, son
 * résultat, les pages du complément, puis le cerfa. `returnTo` : pendant une
 * correction, le rang de la page qui portait l'alerte.
 */
export class JourneyPosition {
  /**
   * Le rang de cette page à cette étape. `asked` : toutes les pages posées,
   * celles d'avant le verrou comprises ; `pages` : celles de l'étape.
   */
  static of(
    stage: SimulationStage,
    asked: readonly Page[],
    pages: readonly Page[],
    page: Page | undefined,
    returnTo?: number,
  ): JourneyPosition {
    const at = page ? pages.indexOf(page) + 1 : 1;
    const before = asked.length - pages.length;
    const steps = {
      questionnaire: at,
      resultat: pages.length + 1,
      complement: before + 1 + at,
      cerfa: before + 2 + pages.length,
    };
    return new JourneyPosition(steps[stage.name], returnTo);
  }

  readonly step: number;
  readonly returnTo?: number;

  constructor(step: number, returnTo?: number) {
    if (
      !JourneyPosition.#isARank(step) ||
      (returnTo !== undefined && !JourneyPosition.#isARank(returnTo))
    )
      throw new Error(
        `Une position se compte depuis 1 : ${step}, ${returnTo}.`,
      );
    this.step = step;
    if (returnTo !== undefined) this.returnTo = returnTo;
  }

  equals(other: JourneyPosition): boolean {
    return this.step === other.step && this.returnTo === other.returnTo;
  }

  /**
   * Ce qu'ouvre cette position : une page déjà posée, que rien de neuf ne
   * sépare de la page ouverte (`StagePages.reachable`). `returnTo` reprend une
   * correction vers une page plus loin, qui attend sa réponse. `kept` : le
   * brouillon que la simulation garde ; sa page le retrouve, et le brouillon
   * d'une correction suit son origine. Refusée : rien.
   */
  openingIn(pages: StagePages, kept?: KeptDraft): PageOpening | Refused {
    const reached = pages.reachable();
    const page = reached[this.step - 1];
    if (!page) return undefined;
    const draftOf = (on: Page) => (kept?.page === on ? kept.draft : undefined);
    if (this.returnTo === undefined)
      return new PageOpening(page, undefined, draftOf(page));
    const origin = reached[this.returnTo - 1];
    if (!origin || this.returnTo <= this.step || !pages.isPending(origin))
      return undefined;
    const correction = new AnswerCorrection(
      origin,
      draftOf(origin) ?? {},
      this.returnTo,
    );
    return new PageOpening(page, correction);
  }

  static #isARank(value: number): boolean {
    return Number.isInteger(value) && value >= 1;
  }
}
