// Une mesure d'audience qui garde ce qu'elle reçoit, pour lire ce que l'écran
// y compte. Ses use cases sont les vrais.

import {
  type AudienceUseCases,
  CompleteAQuestionnaire,
  LeaveAQuestionnaire,
  PassAStep,
  ReachAnAldResult,
  StartAQuestionnaire,
} from "../../../front/socle/analytics";
import type { AudienceEvent } from "../../../front/socle/analytics/audience-event.entity";

export function audienceDeTest(): {
  audience: AudienceUseCases;
  mesures: AudienceEvent[];
} {
  const mesures: AudienceEvent[] = [];
  const port = { track: (evenement: AudienceEvent) => mesures.push(evenement) };
  return {
    audience: {
      startAQuestionnaire: new StartAQuestionnaire(port),
      passAStep: new PassAStep(port),
      completeAQuestionnaire: new CompleteAQuestionnaire(port),
      leaveAQuestionnaire: new LeaveAQuestionnaire(port),
      reachAnAldResult: new ReachAnAldResult(port),
    },
    mesures,
  };
}

/** Les noms mesurés, avec leur valeur s'ils en ont une. */
export const nomsEtValeurs = (mesures: AudienceEvent[]) =>
  mesures.map(({ name, value }) =>
    value === undefined ? name : [name, value],
  );
