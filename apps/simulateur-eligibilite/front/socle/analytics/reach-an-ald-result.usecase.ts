// Arriver sur le premier résultat par un parcours ALD (#148) : compter son
// verdict, avec le nombre de questions posées et rien des réponses.

import type { RattachementSaisi } from "../../../shared/rattachement-saisi";
import type { Audience } from "./audience.port";
import { type AldVerdict, AudienceEvent } from "./audience-event.entity";

export class ReachAnAldResult {
  readonly #audience: Audience;

  constructor(audience: Audience) {
    this.#audience = audience;
  }

  execute(
    verdict: AldVerdict,
    questions: number,
    rattachement: RattachementSaisi | null,
  ): void {
    this.#audience.track(AudienceEvent.of(verdict, rattachement, questions));
  }
}
