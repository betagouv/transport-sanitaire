// Le journal des parcours, donné à l'arbre React. `App` reçoit ses use cases
// du conteneur et les pose en contexte ; le simulateur les lit par
// `useJournal`. Sans use cases donnés, comme dans les tests qui n'en passent
// pas, aucun journal ne reçoit rien.
//
// Le rattachement se lit ici, en session : il ne transite pas par le
// simulateur, qui ignore qui prescrit.

import { createContext, useContext, useMemo } from "react";
import { rattachementEnSession } from "../rattachement";
import type { Journey } from "./journey.entity";
import type { ModelIntent, SelectAnIntent } from "./select-an-intent.usecase";
import type { StartASimulation } from "./start-a-simulation.usecase";

/** Les use cases du journal, que le conteneur instancie. */
export type JournalUseCases = {
  startASimulation: StartASimulation;
  selectAnIntent: SelectAnIntent;
};

/** Ce que le simulateur peut signaler au journal. */
export type JournalForTheSimulateur = {
  /** Ouvre le parcours d'une simulation, sous le rattachement en session. */
  start: () => Journey;
  selectIntent: (journey: Journey, intent: ModelIntent) => void;
};

const JournalContext = createContext<JournalUseCases | null>(null);

export const JournalProvider = JournalContext.Provider;

/** Le journal des parcours. `null` : aucun journal ne reçoit rien. */
export function useJournal(): JournalForTheSimulateur | null {
  const useCases = useContext(JournalContext);
  return useMemo(
    () =>
      useCases && {
        start: () => useCases.startASimulation.execute(rattachementEnSession()),
        selectIntent: (journey: Journey, intent: ModelIntent) =>
          useCases.selectAnIntent.execute(journey, intent),
      },
    [useCases],
  );
}
