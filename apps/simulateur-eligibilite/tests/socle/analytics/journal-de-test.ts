// Un journal des parcours qui garde ce qu'il reçoit, pour lire ce que l'écran
// y envoie. Ses use cases sont les vrais ; la mesure d'audience ne garde rien.
// La page s'est ouverte normalement, sauf si le test dit autre chose.

import {
  type AnalyticsUseCases,
  analyticsUseCases,
  DiscardingAudience,
} from "../../../front/socle/analytics";
import type { PageLoad } from "../../../front/socle/analytics/page-load.port";
import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event";

/** Une page ouverte comme `navigation` le dit. */
export const chargee = (
  navigation: ReturnType<PageLoad["navigation"]>,
): PageLoad => ({ navigation: () => navigation });

export function journalDeTest(pageLoad = chargee("navigate")): {
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
    analytics: analyticsUseCases(new DiscardingAudience(), port, pageLoad),
    envoyes,
  };
}
