// Le questionnaire à l'écran : la page ouverte de la simulation, son brouillon,
// ce qu'il reste à répondre, et ce que font ses boutons et ses liens. La
// simulation sait valider une page, avancer, reculer et rouvrir une réponse à
// revoir (`core/socle/simulation/`) ; l'écran n'y ajoute que le brouillon,
// l'avancement automatique, le focus et la mesure d'audience.

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

import type { Simulation } from "../../../core/socle/simulation";
import {
  type QuestionnaireTracking,
  useQuestionnaireTracking,
} from "../analytics";
import {
  isSingleChoicePage,
  useAutoAdvance,
  withRestart,
} from "./advance-alone";
import { draftOf } from "./draft-an-answer";
import { type RevisitLink, revisitLinks } from "./revisit-an-answer";

export type QuestionnaireOptions = {
  // La simulation, sur la page que le questionnaire affiche.
  simulation: Simulation;
  // La simulation après un bouton : la page suivante, la précédente, ou
  // l'étape qui suit quand la dernière page est validée.
  onChange: (simulation: Simulation) => void;
  // La mesure d'audience compte-t-elle ce questionnaire ? Le journal les suit
  // tous les deux.
  counted: boolean;
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
  // La question qui prend le focus à l'entrée de la page : celle qu'un lien
  // vient de rouvrir. Aucune : la première.
  focus: string | undefined;
};

export type Actions = {
  answer: (id: string, answer: Answer | Unanswered) => void;
  next: () => void;
  back: () => void;
  // Rouvre la page de cette réponse à revoir.
  revisit: (question: string) => void;
};

export type QuestionnaireScreen = View &
  Actions & {
    // La page avancera d'elle-même : le bouton « Suivant » n'a pas à s'afficher.
    autoAdvances: boolean;
    // Les liens vers les réponses à revoir de cette question.
    revisitsOf: (question: AskedQuestion) => readonly RevisitLink[];
  };

export function useQuestionnaire({
  simulation,
  onChange,
  counted,
}: QuestionnaireOptions): QuestionnaireScreen {
  const { draft, setDraft, focus, move } = useOpenedPage(simulation, onChange);
  const view = read(simulation, draft, focus);
  const tracking = useQuestionnaireTracking({
    simulation,
    questions: view.questions.map(({ id }) => id),
    counted,
    // Un questionnaire qui a déjà des réponses reprend : son début n'est pas réémis.
    resumed: Object.keys(simulation.answers).length > 0,
  });
  const handlers = actions({ simulation, view, tracking, setDraft, move });
  // Pendant une correction, une sélection seule n'avance pas.
  const autoAdvance = useAutoAdvance(
    view.page.id,
    isSingleChoicePage(view.questions) && !simulation.correcting,
    view.hasPendingQuestions,
    handlers.next,
  );
  return {
    ...view,
    ...withRestart(handlers, autoAdvance),
    revisitsOf: (question) => revisitLinks(simulation, question, draft),
  };
}

// ---- implémentation ----

type Move = (next: Simulation, focus?: string) => void;

type Context = {
  simulation: Simulation;
  view: View;
  tracking: QuestionnaireTracking;
  setDraft: (draft: Answers) => void;
  move: Move;
};

// Le brouillon de la page ouverte, et la question qui y prend le focus. Une
// autre simulation, qu'un bouton ou l'adresse de la page l'ouvre, repart de ses
// réponses validées, et du brouillon qu'elle retrouve au retour d'une
// correction.
function useOpenedPage(
  simulation: Simulation,
  onChange: (simulation: Simulation) => void,
) {
  const draftOn = (opened: Simulation) =>
    draftOf(opened.page, { ...opened.answers, ...opened.restoredDraft });
  const [opened, setOpened] = useState(simulation);
  const [draft, setDraft] = useState<Answers>(() => draftOn(simulation));
  const [focus, setFocus] = useState<{ on: Simulation; question: string }>();
  // Le brouillon de la nouvelle page vaut dès ce rendu : ce qui suit le lit.
  let shown = draft;
  if (opened !== simulation) {
    shown = draftOn(simulation);
    setOpened(simulation);
    setDraft(shown);
  }
  const move: Move = (next, question) => {
    setFocus(question === undefined ? undefined : { on: next, question });
    onChange(next);
  };
  const focused = focus?.on === simulation ? focus.question : undefined;
  return { draft: shown, setDraft, focus: focused, move };
}

// Le brouillon passe par-dessus les réponses validées : ce que la page pose
// peut en dépendre.
function read(
  simulation: Simulation,
  draft: Answers,
  focus: string | undefined,
): View {
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
    focus,
  };
}

// Valider la page avec ce brouillon achève l'étape, au lieu d'en ouvrir une autre.
function ends(simulation: Simulation, draft: Answers): boolean {
  return simulation.validate(draft).stage.name !== simulation.stage.name;
}

// Une correction n'est pas une étape de plus du parcours : la mesure d'audience
// n'en compte que la fin du questionnaire, si elle y mène.
function actions({
  simulation,
  view,
  tracking,
  setDraft,
  move,
}: Context): Actions {
  return {
    // Une saisie vide les questions de la page qui en dépendent (`dependsOn`).
    answer: (id, answer) => {
      setDraft(answerOnPage(view.page, view.draft, id, answer));
      tracking.answered(id);
    },
    next: () => {
      // Le bouton est déjà désactivé, ceci couvre une soumission au clavier.
      if (view.hasPendingQuestions) return;
      const next = simulation.validate(view.draft);
      if (next.stage.name !== simulation.stage.name) {
        tracking.questionnaireCompleted(next);
      } else if (simulation.correcting) {
        tracking.answerCorrected(next);
      } else {
        tracking.stepPassed(next);
      }
      move(next);
    },
    // Reculer ne valide rien : le brouillon de la page quittée est abandonné.
    back: () => move(simulation.back()),
    revisit: (question) => {
      const revisited = simulation.revisit(question, view.draft);
      if (revisited) move(revisited, question);
    },
  };
}
