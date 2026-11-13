// Le parcours d'une simulation, signalé au journal (#383) : ouvert au montage
// du simulateur, une seule fois, puis l'intention dès que le modèle la donne.
// « Précédent » et le retour à P0 gardent le parcours, « Faire une nouvelle
// simulation » remonte le simulateur et en ouvre un autre. Ce qui part ou non
// est décidé par `Journey`.
//
// Le rattachement se lit ici, en session : il ne transite pas par le
// simulateur, qui ignore qui prescrit.

import { useEffect, useRef } from "react";
import type { Simulation } from "../../../core/socle/simulation";
import type { Model } from "../model";
import { rattachementEnSession } from "../rattachement";
import type { Journey } from "./journey.entity";
import { useJournalUseCases } from "./use-cases-in-the-tree";

export function useRecordTheJourney(
  model: Model,
  simulation: Simulation,
  seeded: boolean,
): void {
  const useCases = useJournalUseCases();
  const journey = useRef<Journey | null>(null);
  // La ref garde le parcours si React rejoue l'effet (StrictMode).
  // biome-ignore lint/correctness/useExhaustiveDependencies: un parcours par montage
  useEffect(() => {
    if (!useCases || journey.current) return;
    journey.current = useCases.startASimulation.execute({
      rattachement: rattachementEnSession(),
      seeded,
    });
  }, []);
  useEffect(() => {
    if (!useCases || !journey.current || !model.intent) return;
    const intent = simulation.read(new Date())(model.intent);
    if (intent) useCases.selectAnIntent.execute(journey.current, intent);
  }, [useCases, model, simulation]);
}
