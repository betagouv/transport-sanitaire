// Une mesure d'audience qui garde ce qu'elle reçoit, pour lire ce que l'écran
// y compte. Son use case est le vrai.

import {
  type AudienceUseCases,
  TrackAnEvent,
} from "../../../front/socle/analytics";
import type { AudienceEvent } from "../../../front/socle/analytics/audience-event.entity";

export function audienceDeTest(): {
  audience: AudienceUseCases;
  mesures: AudienceEvent[];
} {
  const mesures: AudienceEvent[] = [];
  const port = { track: (evenement: AudienceEvent) => mesures.push(evenement) };
  return { audience: { trackAnEvent: new TrackAnEvent(port) }, mesures };
}

/** Les noms mesurés, avec leur valeur s'ils en ont une. */
export const nomsEtValeurs = (mesures: AudienceEvent[]) =>
  mesures.map(({ name, value }) =>
    value === undefined ? name : [name, value],
  );
