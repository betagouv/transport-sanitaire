// La mesure d'audience, donnée à l'arbre React. `App` reçoit son use case du
// conteneur et le pose en contexte ; le questionnaire et le simulateur comptent
// leurs étapes par `useAudience`. Sans use case donné, comme en local ou dans
// les tests qui n'en passent pas, rien n'est mesuré.
//
// Le rattachement se lit ici, en session : il ne transite pas par le
// simulateur, qui ignore qui prescrit.

import { createContext, useContext, useMemo } from "react";
import { rattachementEnSession } from "../rattachement";
import type { AudienceEventName } from "./audience-event.entity";
import type { TrackAnEvent } from "./track-an-event.usecase";

/** Les use cases de la mesure d'audience, que le conteneur instancie. */
export type AudienceUseCases = { trackAnEvent: TrackAnEvent };

/** Compte un événement, sous le service rattaché en session. */
export type Track = (name: AudienceEventName, value?: number) => void;

const AudienceContext = createContext<AudienceUseCases | null>(null);

export const AudienceProvider = AudienceContext.Provider;

export function useAudience(): Track {
  const useCases = useContext(AudienceContext);
  return useMemo(
    () => (name, value) =>
      useCases?.trackAnEvent.execute(name, rattachementEnSession(), value),
    [useCases],
  );
}
