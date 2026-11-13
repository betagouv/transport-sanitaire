// L'affichage d'un écran de résultat, R2 ou R3 (ADR-11) : il s'ouvre au
// montage de l'écran, une fois par simulation affichée, comme une page du
// questionnaire. La ref garde la simulation ouverte si React rejoue l'effet
// (StrictMode). Il s'ouvre avant les effets de l'écran (`useLayoutEffect`) :
// ses boutons y sont exposés.

import { useLayoutEffect, useRef } from "react";
import type { Simulation } from "../../../core/socle/simulation";
import type { ResultScreen } from "./journey.entity";
import { useAnalyticsUseCases, useJourney } from "./use-cases-in-the-tree";

export function useResultScreen(
  screen: ResultScreen,
  simulation: Simulation,
): void {
  const useCases = useAnalyticsUseCases();
  const journeyOf = useJourney();
  const opened = useRef<Simulation | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: un affichage par simulation affichée
  useLayoutEffect(() => {
    const journey = journeyOf();
    if (!useCases || !journey || opened.current === simulation) return;
    opened.current = simulation;
    useCases.openAResultScreen.execute(journey, screen);
  }, [simulation]);
}
