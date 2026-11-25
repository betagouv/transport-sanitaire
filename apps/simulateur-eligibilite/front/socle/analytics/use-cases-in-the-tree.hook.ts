// Les use cases de la mesure d'audience et du journal, posés dans l'arbre React.
// `App` les reçoit du conteneur ; les hooks (`*.hook.ts`) les lisent. Sans use
// cases donnés, comme dans les tests qui n'en passent pas, rien ne part.
//
// Le parcours de la simulation s'y pose aussi : le simulateur l'ouvre, le
// questionnaire y signale ses pages.

import { createContext, type RefObject, useContext } from "react";
import type { AnalyticsUseCases } from "./container";
import type { Journey } from "./journey.entity";

/** Absents : rien ne part. */
type NotGiven = null;

/** Le parcours de la simulation, une fois ouvert. */
export type OpenedJourney = RefObject<Journey | null>;

const AnalyticsContext = createContext<AnalyticsUseCases | NotGiven>(null);
const JourneyContext = createContext<OpenedJourney | NotGiven>(null);

export const AnalyticsProvider = AnalyticsContext.Provider;
export const JourneyProvider = JourneyContext.Provider;

export function useAnalyticsUseCases(): AnalyticsUseCases | NotGiven {
  return useContext(AnalyticsContext);
}

/**
 * Le parcours ouvert par le simulateur, à lire au moment d'un geste : il s'ouvre
 * après le premier rendu. Hors du simulateur : aucun.
 */
export function useJourney(): () => Journey | NotGiven {
  const opened = useContext(JourneyContext);
  return () => opened?.current ?? null;
}
