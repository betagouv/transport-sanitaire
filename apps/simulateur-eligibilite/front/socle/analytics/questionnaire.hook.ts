// Ce que le questionnaire signale à la mesure d'audience : son début au
// montage, chaque étape franchie, sa fin, et son départ quand l'onglet se ferme.
// Ce qui compte ou non est décidé par `QuestionnaireRun`.
//
// Le rattachement se lit ici, en session : il ne transite pas par le
// questionnaire, qui ignore qui prescrit.

import { useEffect, useRef } from "react";
import { rattachementEnSession } from "../rattachement";
import type { QuestionnaireRun } from "./questionnaire-run.entity";
import { useAudienceUseCases } from "./use-cases-in-the-tree";

export type QuestionnaireTracking = {
  stepPassed: (page: number) => void;
  questionnaireCompleted: () => void;
};

/**
 * `current` : le rang de la page ouverte. `counted` : le questionnaire est-il
 * compté ? `resumed` : il a déjà des réponses.
 */
export function useQuestionnaireTracking(
  current: number,
  counted: boolean,
  resumed: boolean,
): QuestionnaireTracking {
  const useCases = useAudienceUseCases();
  const run = useRef<QuestionnaireRun | null>(null);
  // Une ref donne la valeur fraîche au gestionnaire, sans redéclarer l'écouteur.
  const currentRef = useRef(current);
  currentRef.current = current;
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
      useCases.leaveAQuestionnaire.execute(started, currentRef.current);
    window.addEventListener("pagehide", onLeave);
    return () => window.removeEventListener("pagehide", onLeave);
  }, []);
  return {
    stepPassed: (page) => {
      if (useCases && run.current)
        useCases.passAStep.execute(run.current, page);
    },
    questionnaireCompleted: () => {
      if (useCases && run.current)
        useCases.completeAQuestionnaire.execute(run.current);
    },
  };
}
