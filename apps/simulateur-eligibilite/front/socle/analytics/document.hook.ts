// Ce que le document R3 signale au journal : chaque PDF prêt, avec les boutons
// qu'il offre, chaque génération ratée, le PDF prêt retiré, les clics de ses
// boutons, puis l'impression et le téléchargement que l'app lance. Ce qui part
// ou non est décidé par `Journey`.

import { type ButtonTracking, useButtonTracking } from "./button.hook";
import type { Button } from "./button-place.vo";
import type { DocumentContent } from "./document-version.entity";
import type { Journey } from "./journey.entity";
import type { DocumentRequest } from "./revision.entity";
import {
  type AnalyticsUseCases,
  useAnalyticsUseCases,
  useJourney,
} from "./use-cases-in-the-tree";

export type DocumentTracking = ButtonTracking & {
  readonly displayed: (content: DocumentContent) => void;
  readonly failed: () => void;
  /** Le PDF prêt n'est plus affiché : ses boutons ne sont plus exposés. */
  readonly withdrawn: () => void;
  /** L'app lance l'impression ou le téléchargement du PDF. */
  readonly launched: (request: DocumentRequest) => void;
  /** Le PDF est remis au navigateur. */
  readonly delivered: () => void;
};

/** `buttons` : ceux que le document offre, une fois son PDF prêt. */
export function useDocumentTracking(
  buttons: readonly Button[],
): DocumentTracking {
  const tracked = useTracked();
  return {
    ...useButtonTracking(),
    displayed: (content) =>
      tracked((u, j) => u.displayADocument.execute(j, content, buttons)),
    failed: () => tracked((u, j) => u.failADocument.execute(j)),
    withdrawn: () => tracked((u, j) => u.withdrawADocument.execute(j)),
    launched: (request) =>
      tracked((u, j) => u.launchADocument.execute(j, request)),
    delivered: () => tracked((u, j) => u.deliverADownload.execute(j)),
  };
}

// ---- implémentation ----

// Un geste, confié à son use case si le parcours est ouvert.
function useTracked() {
  const useCases = useAnalyticsUseCases();
  const journeyOf = useJourney();
  return (gesture: (useCases: AnalyticsUseCases, journey: Journey) => void) => {
    const journey = journeyOf();
    if (useCases && journey) gesture(useCases, journey);
  };
}
