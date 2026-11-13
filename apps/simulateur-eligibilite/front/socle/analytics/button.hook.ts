// Ce que les boutons d'un écran de résultat signalent au journal : chaque clic,
// et chaque PDF remis au navigateur. Chacun part avec l'exposition que l'écran
// a reçue à son affichage : jamais avec celle d'un autre. Sans exposition,
// rien ne part. Ce qui part ou non est décidé par `Journey`.

import type { RefObject } from "react";
import type { Button, Exposures } from "./button-exposure.entity";
import { useAnalyticsUseCases, useJourney } from "./use-cases-in-the-tree";

export type ButtonTracking = {
  /** Le bouton est cliqué. */
  readonly pressed: (button: Button) => void;
  /** Le PDF que son clic a demandé est remis au navigateur. */
  readonly delivered: (button: Button) => void;
};

export function useButtonTracking(
  exposures: RefObject<Exposures>,
): ButtonTracking {
  const useCases = useAnalyticsUseCases();
  const journeyOf = useJourney();
  return {
    pressed(button) {
      const journey = journeyOf();
      const exposure = exposures.current[button];
      if (useCases && journey && exposure)
        useCases.pressAButton.execute(journey, exposure);
    },
    delivered(button) {
      const journey = journeyOf();
      const exposure = exposures.current[button];
      if (useCases && journey && exposure)
        useCases.deliverADownload.execute(journey, exposure);
    },
  };
}
