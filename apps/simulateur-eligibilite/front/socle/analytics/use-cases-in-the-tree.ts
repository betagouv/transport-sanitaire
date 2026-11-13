// Les use cases de la mesure d'audience et du journal, posés dans l'arbre React.
// `App` les reçoit du conteneur ; les hooks (`*.hook.ts`) les lisent. Sans use
// cases donnés, comme dans les tests qui n'en passent pas, rien ne part.
//
// Le parcours de la simulation s'y pose aussi : le simulateur l'ouvre, le
// questionnaire y signale ses pages.

import { createContext, type RefObject, useContext } from "react";
import { AnswerAQuestion } from "./answer-a-question.usecase";
import type { Audience } from "./audience.port";
import { CompleteAQuestionnaire } from "./complete-a-questionnaire.usecase";
import { CorrectAnAnswer } from "./correct-an-answer.usecase";
import type { Journal } from "./journal.port";
import type { Journey } from "./journey.entity";
import { LeaveAQuestionnaire } from "./leave-a-questionnaire.usecase";
import { OpenAPage } from "./open-a-page.usecase";
import { PassAStep } from "./pass-a-step.usecase";
import { ReachAnAldResult } from "./reach-an-ald-result.usecase";
import { RevealQuestions } from "./reveal-questions.usecase";
import { SelectAnIntent } from "./select-an-intent.usecase";
import { StartAQuestionnaire } from "./start-a-questionnaire.usecase";
import { StartASimulation } from "./start-a-simulation.usecase";

/** Un use case par geste de l'écran, qui parle à l'audience, au journal, ou aux deux. */
export type AnalyticsUseCases = ReturnType<typeof analyticsUseCases>;

export function analyticsUseCases(audience: Audience, journal: Journal) {
  return {
    startASimulation: new StartASimulation(journal),
    selectAnIntent: new SelectAnIntent(journal),
    startAQuestionnaire: new StartAQuestionnaire(audience),
    openAPage: new OpenAPage(journal),
    revealQuestions: new RevealQuestions(journal),
    answerAQuestion: new AnswerAQuestion(journal),
    passAStep: new PassAStep(audience, journal),
    correctAnAnswer: new CorrectAnAnswer(journal),
    completeAQuestionnaire: new CompleteAQuestionnaire(audience, journal),
    leaveAQuestionnaire: new LeaveAQuestionnaire(audience),
    reachAnAldResult: new ReachAnAldResult(audience),
  };
}

/** Absents : rien ne part. */
type NotGiven = null;

/** Le parcours de la simulation, une fois ouvert. */
export type OpenedJourney = RefObject<Journey | null>;

const AnalyticsContext = createContext<AnalyticsUseCases | NotGiven>(null);
const JourneyContext = createContext<OpenedJourney | NotGiven>(null);

export const AnalyticsProvider = AnalyticsContext.Provider;
export const JourneyProvider = JourneyContext.Provider;

export function useAnalyticsUseCases(): AnalyticsUseCases | NotGiven {
  return useContext(AnalyticsContext);
}

/**
 * Le parcours ouvert par le simulateur, à lire au moment d'un geste : il s'ouvre
 * après le premier rendu. Hors du simulateur : aucun.
 */
export function useJourney(): () => Journey | NotGiven {
  const opened = useContext(JourneyContext);
  return () => opened?.current ?? null;
}
