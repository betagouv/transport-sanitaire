// Les liens d'une alerte vers les réponses d'avant à revoir (ADR-30). La
// simulation dit lesquels se rouvrent : une question validée, sur une page
// d'avant, avant le verrou. Les autres ne s'affichent pas. Chaque lien est une
// vraie adresse, la position que la correction ouvre.

import type {
  Answers,
  AskedQuestion,
} from "../../../core/socle/questionnaire-engine";
import type { Simulation } from "../../../core/socle/simulation";
import { hashOf } from "./position-in-the-address";

/** Un lien vers une réponse à revoir : son libellé, son adresse, sa question. */
export type RevisitLink = {
  readonly label: string;
  readonly href: string;
  readonly question: string;
};

/** Les liens de cette question, sur cette simulation et ce brouillon. */
export function revisitLinks(
  simulation: Simulation,
  question: AskedQuestion,
  draft: Answers,
): readonly RevisitLink[] {
  return question.revisits.flatMap(({ label, question: revisited }) => {
    const opened = simulation.revisit(revisited, draft);
    if (!opened) return [];
    return [{ label, href: hashOf(opened.position), question: revisited }];
  });
}
