// Ce que le questionnaire signale à la mesure d'audience et au journal : son
// début au montage, chaque page ouverte et les questions qui y apparaissent,
// chaque saisie, chaque page validée, sa fin, et son départ quand l'onglet se
// ferme. Ce qui part ou non est décidé par `QuestionnaireRun` et `Journey`.
//
// Le rattachement se lit ici, en session : il ne transite pas par le
// questionnaire, qui ignore qui prescrit.

import { type RefObject, useEffect, useRef } from "react";
import type { Simulation } from "../../../core/socle/simulation";
import { rattachementEnSession } from "../rattachement";
import type { Journey, PageValidation } from "./journey.entity";
import type { OpenedPage } from "./page-view.entity";
import type { QuestionnaireRun } from "./questionnaire-run.entity";
import {
  type AnalyticsUseCases,
  useAnalyticsUseCases,
  useJourney,
} from "./use-cases-in-the-tree";

export type TrackingOptions = {
  /** La simulation sur la page affichée. */
  simulation: Simulation;
  /** Les questions affichées, brouillon compris. */
  questions: readonly string[];
  /** Le questionnaire est-il compté par la mesure d'audience ? */
  counted: boolean;
  /** Le questionnaire a déjà des réponses : il reprend. */
  resumed: boolean;
};

/** Les gestes du questionnaire. Une validation reçoit la simulation qu'elle ouvre. */
export type QuestionnaireTracking = {
  answered: (question: string) => void;
  stepPassed: (next: Simulation) => void;
  answerCorrected: (next: Simulation) => void;
  questionnaireCompleted: (next: Simulation) => void;
};

export function useQuestionnaireTracking(
  options: TrackingOptions,
): QuestionnaireTracking {
  const { simulation, questions } = options;
  const useCases = useAnalyticsUseCases();
  const journeyOf = useJourney();
  const run = useQuestionnaireRun(useCases, options);
  usePageViews(useCases, journeyOf, simulation, questions);
  const gesture = (call: Gesture) => {
    const journey = journeyOf();
    if (useCases && run.current && journey)
      call(useCases, run.current, journey);
  };
  const validation = (next: Simulation) =>
    validationOf(simulation, questions, next);
  return {
    answered: (question) =>
      gesture((u, _, j) => u.answerAQuestion.execute(j, question)),
    stepPassed: (next) =>
      gesture((u, r, j) =>
        u.passAStep.execute(r, j, {
          page: rankOf(simulation) + 1,
          validation: validation(next),
        }),
      ),
    answerCorrected: (next) =>
      gesture((u, _, j) => u.correctAnAnswer.execute(j, validation(next))),
    questionnaireCompleted: (next) =>
      gesture((u, r, j) =>
        u.completeAQuestionnaire.execute(r, j, validation(next)),
      ),
  };
}

// ---- implémentation ----

type Gesture = (
  useCases: AnalyticsUseCases,
  run: QuestionnaireRun,
  journey: Journey,
) => void;

// Le passage du questionnaire, ouvert au montage, une fois.
function useQuestionnaireRun(
  useCases: AnalyticsUseCases | null,
  { simulation, counted, resumed }: TrackingOptions,
): RefObject<QuestionnaireRun | null> {
  const run = useRef<QuestionnaireRun | null>(null);
  // Une ref donne la page fraîche au gestionnaire, sans redéclarer l'écouteur.
  const current = useRef(rankOf(simulation));
  current.current = rankOf(simulation);
  // biome-ignore lint/correctness/useExhaustiveDependencies: un passage par montage
  useEffect(() => {
    if (!useCases) return;
    const started = useCases.startAQuestionnaire.execute({
      rattachement: rattachementEnSession(),
      counted,
      resumed,
    });
    run.current = started;
    const onLeave = () =>
      useCases.leaveAQuestionnaire.execute(started, current.current);
    window.addEventListener("pagehide", onLeave);
    return () => window.removeEventListener("pagehide", onLeave);
  }, []);
  return run;
}

// Un affichage naît d'une autre simulation, jamais d'un rendu. Une saisie qui
// change les questions de la page les montre dans le même affichage. La ref
// garde la simulation ouverte si React rejoue l'effet (StrictMode).
function usePageViews(
  useCases: AnalyticsUseCases | null,
  journeyOf: () => Journey | null,
  simulation: Simulation,
  questions: readonly string[],
): void {
  const opened = useRef<Simulation | null>(null);
  const shown = questions.join(" ");
  // biome-ignore lint/correctness/useExhaustiveDependencies: une page ouverte, ou d'autres questions
  useEffect(() => {
    const journey = journeyOf();
    if (!useCases || !journey) return;
    if (opened.current === simulation) {
      useCases.revealQuestions.execute(journey, questions);
      return;
    }
    opened.current = simulation;
    useCases.openAPage.execute(journey, openedPage(simulation, questions));
  }, [simulation, shown]);
}

// Le rang de la page affichée, à partir de 1.
function rankOf(simulation: Simulation): number {
  return simulation.pages().indexOf(simulation.page) + 1;
}

function openedPage(
  simulation: Simulation,
  questions: readonly string[],
): OpenedPage {
  const { part, first, last } = simulation.placeInPart;
  return { id: simulation.page.id, part, first, last, questions };
}

// La page validée. Une validation qui change d'étape n'ouvre aucune page.
function validationOf(
  simulation: Simulation,
  questions: readonly string[],
  next: Simulation,
): PageValidation {
  const sameStage = next.stage.name === simulation.stage.name;
  return {
    questions,
    stillValidated: Object.keys(next.validated.toJSON()),
    nextPart: sameStage ? next.placeInPart.part : null,
  };
}
