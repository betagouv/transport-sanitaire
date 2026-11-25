// Le parcours d'une simulation, signalé au journal : ouvert au montage
// du simulateur, une seule fois, puis l'intention dès que le modèle la donne.
// « Précédent » et le retour à P0 gardent le parcours, « Faire une nouvelle
// simulation » le ferme, remonte le simulateur et en ouvre un autre. Ce qui
// part ou non est décidé par `Journey`.
//
// Le parcours s'ouvre et lit l'intention avant les effets des écrans du
// simulateur (`useLayoutEffect`) : le début précède la première page, et
// l'intention la page qui suit P0. Le simulateur le pose dans l'arbre
// (`JourneyProvider`) pour que le questionnaire y signale ses pages.
//
// Le rattachement se lit ici, en session : il ne transite pas par le
// simulateur, qui ignore qui prescrit.

import { useLayoutEffect, useRef } from "react";
import type { Simulation } from "../../../core/socle/simulation";
import type { Model } from "../model.types";
import { RattachementSessionService } from "../rattachement";
import type { Journey } from "./journey.entity";
import {
  type OpenedJourney,
  useAnalyticsUseCases,
} from "./use-cases-in-the-tree.hook";

export function useRecordTheJourney(
  model: Model,
  simulation: Simulation,
  seeded: boolean,
): OpenedJourney {
  const useCases = useAnalyticsUseCases();
  const journey = useRef<Journey | null>(null);
  // La ref garde le parcours si React rejoue l'effet (StrictMode).
  // biome-ignore lint/correctness/useExhaustiveDependencies: un parcours par montage
  useLayoutEffect(() => {
    if (!useCases || journey.current) return;
    journey.current = useCases.startASimulation.execute({
      rattachement: RattachementSessionService.enSession(),
      seeded,
      modelVersion: model.version,
    });
  }, []);
  useLayoutEffect(() => {
    if (!useCases || !journey.current || !model.intent) return;
    const intent = model.intent.in(simulation.resultContext(new Date()));
    if (intent) useCases.selectAnIntent.execute(journey.current, intent);
  }, [useCases, model, simulation]);
  return journey;
}

/**
 * « Faire une nouvelle simulation » : le parcours ouvert se ferme au journal,
 * puis le simulateur se remonte sur un nouveau.
 */
export function useNewSimulation(
  journey: OpenedJourney,
  onNewSimulation: () => void,
): () => void {
  const useCases = useAnalyticsUseCases();
  return () => {
    if (useCases && journey.current)
      useCases.closeASimulation.execute(journey.current, "new_simulation");
    onNewSimulation();
  };
}
