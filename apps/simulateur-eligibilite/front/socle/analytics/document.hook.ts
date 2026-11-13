// Ce que le document R3 signale au journal : chaque PDF prêt, et chaque
// génération ratée. Ce qui part ou non est décidé par `Journey`.

import type { DocumentContent } from "./document-version.entity";
import { useAnalyticsUseCases, useJourney } from "./use-cases-in-the-tree";

export type DocumentTracking = {
  readonly displayed: (content: DocumentContent) => void;
  readonly failed: () => void;
};

export function useDocumentTracking(): DocumentTracking {
  const useCases = useAnalyticsUseCases();
  const journeyOf = useJourney();
  return {
    displayed(content) {
      const journey = journeyOf();
      if (useCases && journey)
        useCases.displayADocument.execute(journey, content);
    },
    failed() {
      const journey = journeyOf();
      if (useCases && journey) useCases.failADocument.execute(journey);
    },
  };
}
