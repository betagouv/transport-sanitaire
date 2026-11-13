// Un journal des parcours qui garde ce qu'il reçoit, pour lire ce que l'écran
// y envoie. Ses use cases sont les vrais.

import {
  type JournalUseCases,
  SelectAnIntent,
  StartASimulation,
} from "../../../front/socle/analytics";
import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event";

export function journalDeTest(): {
  journal: JournalUseCases;
  envoyes: AnalyticsEvent[];
} {
  const envoyes: AnalyticsEvent[] = [];
  const port = {
    record: async (evenement: AnalyticsEvent) => {
      envoyes.push(evenement);
    },
  };
  return {
    journal: {
      startASimulation: new StartASimulation(port),
      selectAnIntent: new SelectAnIntent(port),
    },
    envoyes,
  };
}
