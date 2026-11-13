// Les use cases de la mesure d'audience et du journal, posés dans l'arbre React.
// `App` les reçoit du conteneur ; les hooks (`*.hook.ts`) les lisent. Sans use
// cases donnés, comme dans les tests qui n'en passent pas, rien ne part.

import { createContext, useContext } from "react";
import type { CompleteAQuestionnaire } from "./complete-a-questionnaire.usecase";
import type { LeaveAQuestionnaire } from "./leave-a-questionnaire.usecase";
import type { PassAStep } from "./pass-a-step.usecase";
import type { ReachAnAldResult } from "./reach-an-ald-result.usecase";
import type { SelectAnIntent } from "./select-an-intent.usecase";
import type { StartAQuestionnaire } from "./start-a-questionnaire.usecase";
import type { StartASimulation } from "./start-a-simulation.usecase";

/** Les use cases de la mesure d'audience, que le conteneur instancie. */
export type AudienceUseCases = {
  startAQuestionnaire: StartAQuestionnaire;
  passAStep: PassAStep;
  completeAQuestionnaire: CompleteAQuestionnaire;
  leaveAQuestionnaire: LeaveAQuestionnaire;
  reachAnAldResult: ReachAnAldResult;
};

/** Les use cases du journal, que le conteneur instancie. */
export type JournalUseCases = {
  startASimulation: StartASimulation;
  selectAnIntent: SelectAnIntent;
};

/** Absents : rien ne part. */
type NotGiven = null;

const AudienceContext = createContext<AudienceUseCases | NotGiven>(null);
const JournalContext = createContext<JournalUseCases | NotGiven>(null);

export const AudienceProvider = AudienceContext.Provider;
export const JournalProvider = JournalContext.Provider;

export function useAudienceUseCases(): AudienceUseCases | NotGiven {
  return useContext(AudienceContext);
}

export function useJournalUseCases(): JournalUseCases | NotGiven {
  return useContext(JournalContext);
}
