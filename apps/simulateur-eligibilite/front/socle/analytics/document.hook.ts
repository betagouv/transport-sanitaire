// Ce que le document R3 signale au journal : chaque PDF prêt, avec les boutons
// qu'il offre, chaque génération ratée, puis les clics de ses boutons. Ce qui
// part ou non est décidé par `Journey`.

import { useRef } from "react";
import { type ButtonTracking, useButtonTracking } from "./button.hook";
import type { Button, Exposures } from "./button-exposure.entity";
import type { DocumentContent } from "./document-version.entity";
import { useAnalyticsUseCases, useJourney } from "./use-cases-in-the-tree";

export type DocumentTracking = ButtonTracking & {
  readonly displayed: (content: DocumentContent) => void;
  readonly failed: () => void;
};

/** `buttons` : ceux que le document offre, une fois son PDF prêt. */
export function useDocumentTracking(
  buttons: readonly Button[],
): DocumentTracking {
  const useCases = useAnalyticsUseCases();
  const journeyOf = useJourney();
  const exposures = useRef<Exposures>({});
  return {
    ...useButtonTracking(exposures),
    displayed(content) {
      const journey = journeyOf();
      if (useCases && journey)
        exposures.current = useCases.displayADocument.execute(
          journey,
          content,
          buttons,
        );
    },
    failed() {
      const journey = journeyOf();
      if (useCases && journey) useCases.failADocument.execute(journey);
    },
  };
}
