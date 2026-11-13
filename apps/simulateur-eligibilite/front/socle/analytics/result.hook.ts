// Ce que le premier résultat signale au journal : son affichage, une fois son
// contenu chargé et la complétion connue, et les boutons qu'il offre, puis
// leurs clics. Ce qui part ou non est décidé par `Journey`.

import { useEffect, useRef } from "react";
import type { FirstResult } from "../model";
import { type ButtonTracking, useButtonTracking } from "./button.hook";
import type { Button, Exposures } from "./button-exposure.entity";
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
  /** Les boutons que le résultat chargé offre. */
  buttons: readonly Button[];
};

export function useResultTracking({
  loaded,
  canComplete,
  codes,
  buttons,
}: ResultTracking): ButtonTracking {
  const useCases = useAnalyticsUseCases();
  const journeyOf = useJourney();
  const exposures = useRef<Exposures>({});
  // biome-ignore lint/correctness/useExhaustiveDependencies: un affichage par résultat chargé
  useEffect(() => {
    const journey = journeyOf();
    if (!useCases || !journey || !loaded || canComplete === null) return;
    const shown = {
      canComplete,
      codes,
      motifs: loaded.motifs ?? [],
      portions: loaded.portions ?? [],
    };
    exposures.current = useCases.displayAResult.execute(
      journey,
      shown,
      buttons,
    );
  }, [loaded, canComplete]);
  return useButtonTracking(exposures);
}
