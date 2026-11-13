// Compter une étape du parcours dans la mesure d'audience.

import type { RattachementSaisi } from "../../../shared/rattachement-saisi";
import type { Audience } from "./audience.port";
import { AudienceEvent, type AudienceEventName } from "./audience-event.entity";

export class TrackAnEvent {
  readonly #audience: Audience;

  constructor(audience: Audience) {
    this.#audience = audience;
  }

  execute(
    name: AudienceEventName,
    rattachement: RattachementSaisi | null,
    value?: number,
  ): void {
    this.#audience.track(AudienceEvent.of(name, rattachement, value));
  }
}
