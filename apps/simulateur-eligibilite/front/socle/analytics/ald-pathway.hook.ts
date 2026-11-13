// L'arrivée d'un parcours ALD sur le premier résultat (#148), signalée à la
// mesure d'audience. Le simulateur calcule le verdict, qui lit le modèle.
//
// Le rattachement se lit ici, en session : il ne transite pas par le
// simulateur, qui ignore qui prescrit.

import { rattachementEnSession } from "../rattachement";
import type { AldVerdict } from "./audience-event.entity";
import { useAudienceUseCases } from "./use-cases-in-the-tree";

/** Signale l'arrivée d'un parcours ALD sur le premier résultat. */
export type AldResultReached = (verdict: AldVerdict, questions: number) => void;

export function useAldResultReached(): AldResultReached {
  const useCases = useAudienceUseCases();
  return (verdict, questions) =>
    useCases?.reachAnAldResult.execute(
      verdict,
      questions,
      rattachementEnSession(),
    );
}
