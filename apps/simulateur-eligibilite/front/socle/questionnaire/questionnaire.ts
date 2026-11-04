// Le questionnaire à l'écran : la page ouverte de la simulation, son brouillon,
// ce qu'il reste à répondre, et ce que font ses boutons. La simulation sait
// valider une page, avancer et reculer (`core/socle/simulation/`) ; l'écran
// n'y ajoute que le brouillon, l'avancement automatique et la mesure
// d'audience.

import { useState } from "react";
import {
  type Answer,
  type Answers,
  type AskedQuestion,
  answerOnPage,
  type Page,
  type Unanswered,
  type Validated,
} from "../../../core/socle/questionnaire-engine";

import type { Simulation } from "../../../core/socle/simulation/simulation";
import {
  isSingleChoicePage,
  useAutoAdvance,
  withRestart,
} from "./advance-alone";
import { draftOf } from "./draft-an-answer";
import {
  type QuestionnaireTracking,
  useQuestionnaireTracking,
} from "./send-to-analytics";

export type QuestionnaireOptions = {
  // La simulation, sur la page que le questionnaire affiche.
  simulation: Simulation;
  // La simulation après un bouton : la page suivante, la précédente, ou
  // l'étape qui suit quand la dernière page est validée.
  onChange: (simulation: Simulation) => void;
  // Le questionnaire émet-il ses évènements de mesure d'audience ?
  tracked: boolean;
};

type View = {
  page: Page;
  // Les pages affichées, pour la trace de debug.
  pages: readonly Page[];
  questions: readonly AskedQuestion[];
  // Les réponses de la page telles qu'elles sont à l'écran. Elles ne comptent
  // qu'une fois la page validée.
  draft: Answers;
  answers: Answers;
  // Les questions validées, pour la trace de debug.
  validated: Validated;
  hasPrevious: boolean;
  // Une question affichée attend encore sa réponse : on ne peut pas avancer.
  hasPendingQuestions: boolean;
  // Avancer termine le questionnaire au lieu d'ouvrir une autre page.
  isLast: boolean;
};

export type Actions = {
  answer: (id: string, answer: Answer | Unanswered) => void;
  next: () => void;
  back: () => void;
};

export type QuestionnaireScreen = View &
  Actions & {
    // La page avancera d'elle-même : le bouton « Suivant » n'a pas à s'afficher.
    autoAdvances: boolean;
  };

export function useQuestionnaire({
  simulation,
  onChange,
  tracked,
}: QuestionnaireOptions): QuestionnaireScreen {
  const [draft, setDraft] = useState<Answers>(() =>
    draftOf(simulation.page, simulation.answers),
  );
  const view = read(simulation, draft);
  // Un questionnaire qui a déjà des réponses reprend : son début n'est pas réémis.
  const resumed = Object.keys(simulation.answers).length > 0;
  const tracking = useQuestionnaireTracking(
    view.pages.indexOf(view.page) + 1,
    tracked,
    resumed,
  );
  const move = (next: Simulation) => {
    setDraft(draftOf(next.page, next.answers));
    onChange(next);
  };
  const handlers = actions({ simulation, view, tracking, setDraft, move });
  const autoAdvance = useAutoAdvance(
    view.page.id,
    isSingleChoicePage(view.questions),
    view.hasPendingQuestions,
    handlers.next,
  );
  return { ...view, ...withRestart(handlers, autoAdvance) };
}

// ---- implémentation ----

type Context = {
  simulation: Simulation;
  view: View;
  tracking: QuestionnaireTracking;
  setDraft: (draft: Answers) => void;
  move: (next: Simulation) => void;
};

// Le brouillon passe par-dessus les réponses validées : ce que la page pose
// peut en dépendre.
function read(simulation: Simulation, draft: Answers): View {
  const { page } = simulation;
  const questions = simulation.questionsOn(page, draft);
  const hasPendingQuestions = questions.some(
    (question) => !question.isAnsweredBy(draft[question.id]),
  );
  return {
    page,
    pages: simulation.pages(),
    questions,
    draft,
    answers: simulation.answers,
    validated: simulation.validated.toJSON(),
    hasPrevious: simulation.hasPrevious(),
    hasPendingQuestions,
    isLast: !hasPendingQuestions && ends(simulation, draft),
  };
}

// Valider la page avec ce brouillon achève l'étape, au lieu d'en ouvrir une autre.
function ends(simulation: Simulation, draft: Answers): boolean {
  return simulation.validate(draft).stage.name !== simulation.stage.name;
}

function actions({
  simulation,
  view,
  tracking,
  setDraft,
  move,
}: Context): Actions {
  return {
    // Une saisie vide les questions de la page qui en dépendent (`dependsOn`).
    answer: (id, answer) =>
      setDraft(answerOnPage(view.page, view.draft, id, answer)),
    next: () => {
      // Le bouton est déjà désactivé, ceci couvre une soumission au clavier.
      if (view.hasPendingQuestions) return;
      const next = simulation.validate(view.draft);
      if (next.stage.name !== simulation.stage.name) {
        tracking.questionnaireCompleted();
      } else {
        tracking.stepPassed(view.pages.indexOf(view.page) + 2);
      }
      move(next);
    },
    // Reculer ne valide rien : le brouillon de la page quittée est abandonné.
    back: () => move(simulation.back()),
  };
}
