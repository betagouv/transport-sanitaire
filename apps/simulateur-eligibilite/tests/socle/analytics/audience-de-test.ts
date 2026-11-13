// Une mesure d'audience qui garde ce qu'elle reçoit, pour lire ce que l'écran
// y compte. Ses use cases sont les vrais ; le journal ne garde rien.

import {
  type AnalyticsUseCases,
  analyticsUseCases,
} from "../../../front/socle/analytics";
import type { AudienceEvent } from "../../../front/socle/analytics/audience-event.entity";

export function audienceDeTest(): {
  analytics: AnalyticsUseCases;
  mesures: AudienceEvent[];
} {
  const mesures: AudienceEvent[] = [];
  const port = { track: (evenement: AudienceEvent) => mesures.push(evenement) };
  return {
    analytics: analyticsUseCases(port, { record: async () => {} }),
    mesures,
  };
}

/** Les noms mesurés, avec leur valeur s'ils en ont une. */
export const nomsEtValeurs = (mesures: AudienceEvent[]) =>
  mesures.map(({ name, value }) =>
    value === undefined ? name : [name, value],
  );
