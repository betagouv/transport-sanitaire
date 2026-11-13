// Le journal des parcours, donné à l'arbre React. `App` reçoit ses use cases
// du conteneur et les pose en contexte ; le simulateur y signale son parcours
// par `useRecordTheJourney`. Sans use cases donnés, comme dans les tests qui
// n'en passent pas, aucun journal ne reçoit rien.
//
// Le rattachement se lit ici, en session : il ne transite pas par le
// simulateur, qui ignore qui prescrit.

import { createContext, useContext, useEffect, useRef } from "react";
import type { Simulation } from "../../../core/socle/simulation";
import type { Model } from "../model";
import { rattachementEnSession } from "../rattachement";
import type { Journey } from "./journey.entity";
import type { SelectAnIntent } from "./select-an-intent.usecase";
import type { StartASimulation } from "./start-a-simulation.usecase";

/** Les use cases du journal, que le conteneur instancie. */
export type JournalUseCases = {
  startASimulation: StartASimulation;
  selectAnIntent: SelectAnIntent;
};

const JournalContext = createContext<JournalUseCases | null>(null);

export const JournalProvider = JournalContext.Provider;

/**
 * Signale au journal le parcours de cette simulation (#383). Une simulation qui
 * démarre sur P0 ouvre un parcours, une seule fois : « Précédent » et le retour
 * à P0 le gardent, « Faire une nouvelle simulation » en ouvre un autre. Une
 * seed, qui s'ouvre au milieu du parcours, n'en ouvre pas.
 *
 * L'intention part au premier choix validé, que le modèle déclare
 * (`Model.intent`). Un retour sur P0 ne la change pas.
 */
export function useRecordTheJourney(
  model: Model,
  simulation: Simulation,
  seeded: boolean,
): void {
  const journal = useContext(JournalContext);
  const journey = useRef<Journey | null>(null);
  const intentKnown = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: un parcours par simulation
  useEffect(() => {
    if (!journal || seeded || journey.current) return;
    journey.current = journal.startASimulation.execute(rattachementEnSession());
  }, []);
  useEffect(() => {
    if (!journal || !journey.current || !model.intent || intentKnown.current)
      return;
    const intent = simulation.read(new Date())(model.intent);
    if (!intent) return;
    intentKnown.current = true;
    journal.selectAnIntent.execute(journey.current, intent);
  }, [journal, model, simulation]);
}
