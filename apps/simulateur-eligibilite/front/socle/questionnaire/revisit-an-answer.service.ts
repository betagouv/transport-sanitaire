// Les liens d'une alerte vers les réponses d'avant à revoir (ADR-0041). La
// simulation dit lesquels se rouvrent : une question validée, sur une page
// d'avant, avant le verrou. Les autres ne s'affichent pas. Chaque lien est une
// vraie adresse, la position que la correction ouvre.

import type {
  Answers,
  AskedQuestion,
} from "../../../core/socle/questionnaire-engine";
import type { Simulation } from "../../../core/socle/simulation";
import { PositionInTheAddressService } from "./position-in-the-address.service";

/** Un lien vers une réponse à revoir : son libellé, son adresse, sa question. */
export type RevisitLink = {
  readonly label: string;
  readonly href: string;
  readonly question: string;
};

/** Les réponses à revoir d'une simulation. */
export class RevisitAnAnswerService {
  readonly #simulation: Simulation;

  constructor(simulation: Simulation) {
    this.#simulation = simulation;
  }

  /** Les liens de cette question, sur ce brouillon. */
  linksOf(question: AskedQuestion, draft: Answers): readonly RevisitLink[] {
    return question.revisits.flatMap(({ label, question: revisited }) => {
      const opened = this.#simulation.revisit(revisited, draft);
      if (!opened) return [];
      const href = PositionInTheAddressService.hashOf(opened.position);
      return [{ label, href, question: revisited }];
    });
  }
}
