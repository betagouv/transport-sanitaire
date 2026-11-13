// Ce que le premier résultat signale au journal : son affichage, une fois son
// contenu chargé et la complétion connue. Ce qui part ou non est décidé par
// `Journey`.

import { useEffect } from "react";
import type { FirstResult } from "../model";
import type { ResultCodes } from "./revision.entity";
import { useAnalyticsUseCases, useJourney } from "./use-cases-in-the-tree";

/** On ne sait pas encore si le résultat se complète : il charge. */
type Pending = null;

export type ResultTracking = {
  /** Le résultat chargé ; aucun tant qu'il charge. */
  loaded: FirstResult | null;
  canComplete: boolean | Pending;
  /** Les codes que le modèle déclare ; aucun s'il n'en déclare pas. */
  codes: ResultCodes | null;
};

export function useResultTracking({
  loaded,
  canComplete,
  codes,
}: ResultTracking): void {
  const useCases = useAnalyticsUseCases();
  const journeyOf = useJourney();
  // biome-ignore lint/correctness/useExhaustiveDependencies: un affichage par résultat chargé
  useEffect(() => {
    const journey = journeyOf();
    if (!useCases || !journey || !loaded || canComplete === null) return;
    useCases.displayAResult.execute(journey, {
      canComplete,
      codes,
      motifs: loaded.motifs ?? [],
      portions: loaded.portions ?? [],
    });
  }, [loaded, canComplete]);
}
