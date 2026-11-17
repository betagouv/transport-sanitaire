// Un journal des parcours qui garde ce qu'il reçoit, pour lire ce que l'écran
// y envoie. Ses use cases sont les vrais ; la mesure d'audience ne garde rien.
// L'app est en 0.8.0, au commit f30aafe, sur les règles 10.1.8.

import {
  type AnalyticsUseCases,
  analyticsUseCases,
  DiscardingAudience,
} from "../../../front/socle/analytics";
import type {
  AnalyticsEvent,
  Provenance,
} from "../../../shared/analytics/analytics-event";

/** L'app de test, telle que le build la fige. */
export const BUILD = { app_version: "0.8.0", commit_sha: "f30aafe" };

/** Ce que chaque événement d'un parcours de test dit de l'app. */
export const PROVENANCE: Provenance = { ...BUILD, version: "10.1.8" };

export function journalDeTest(): {
  analytics: AnalyticsUseCases;
  envoyes: AnalyticsEvent[];
} {
  const envoyes: AnalyticsEvent[] = [];
  const port = {
    record: async (evenement: AnalyticsEvent) => {
      envoyes.push(evenement);
    },
  };
  return {
    analytics: analyticsUseCases(new DiscardingAudience(), port, BUILD),
    envoyes,
  };
}
