// Ce que les boutons d'un écran de résultat signalent au journal : chaque clic.
// Il part avec l'exposition courante du bouton, jamais avec celle d'un autre
// affichage ou d'un autre objet ; sans exposition, rien ne part. Ce qui part ou
// non est décidé par `Journey`.

import type { Button } from "./button-place.vo";
import { useAnalyticsUseCases, useJourney } from "./use-cases-in-the-tree.hook";

export type ButtonTracking = {
  /** Le bouton est cliqué, à la souris ou au clavier. */
  readonly pressed: (button: Button) => void;
};

export function useButtonTracking(): ButtonTracking {
  const useCases = useAnalyticsUseCases();
  const journeyOf = useJourney();
  return {
    pressed(button) {
      const journey = journeyOf();
      if (useCases && journey) useCases.pressAButton.execute(journey, button);
    },
  };
}
