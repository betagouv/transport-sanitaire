// Le parcours, signalé au journal des parcours (#383). Une simulation qui
// démarre sur P0 ouvre un parcours, une seule fois : « Précédent » et le retour
// à P0 le gardent, « Faire une nouvelle simulation » en ouvre un autre. Une
// seed, qui s'ouvre au milieu du parcours, n'en ouvre pas.
//
// L'intention part au premier choix validé, que le modèle déclare
// (`Model.intent`). Un retour sur P0 ne la change pas.

import { useEffect, useRef } from "react";
import type { Simulation } from "../../../core/socle/simulation";
import { type Journey, useJournal } from "../analytics";
import type { Model } from "../model";

export function useRecordTheJourney(
  model: Model,
  simulation: Simulation,
  seeded: boolean,
): void {
  const journal = useJournal();
  const journey = useRef<Journey | null>(null);
  const intentKnown = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: un parcours par simulation
  useEffect(() => {
    if (!journal || seeded || journey.current) return;
    journey.current = journal.start();
  }, []);
  useEffect(() => {
    if (!journal || !journey.current || !model.intent || intentKnown.current)
      return;
    const intent = simulation.read(new Date())(model.intent);
    if (!intent) return;
    intentKnown.current = true;
    journal.selectIntent(journey.current, intent);
  }, [journal, model, simulation]);
}
