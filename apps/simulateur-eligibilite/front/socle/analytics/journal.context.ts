// Le journal des parcours, donné à l'arbre React. `App` le reçoit du conteneur
// et le pose en contexte ; le questionnaire le lit par `useStartASimulation`.
// Sans use case donné, comme dans les tests qui n'en passent pas, aucun
// journal ne reçoit rien.

import { createContext, useContext } from "react";
import { rattachementEnSession } from "../rattachement";
import type { StartASimulation } from "./start-a-simulation.usecase";

const JournalContext = createContext<StartASimulation | null>(null);

export const JournalProvider = JournalContext.Provider;

/** Ouvre une simulation, et la signale au journal s'il y en a un. */
export function useStartASimulation(): () => void {
  const startASimulation = useContext(JournalContext);
  return () => {
    startASimulation?.execute(rattachementEnSession());
  };
}
