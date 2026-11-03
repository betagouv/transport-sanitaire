// Le questionnaire à l'écran : la page ouverte, son brouillon, ce qu'il reste
// à répondre, et la navigation entre les pages. Chaque capacité a son
// fichier ; celui-ci les assemble.

import { useState } from "react";
import type { Relevance } from "../../../core/socle/questionnaire-engine/does-a-question-still-matter/matters";
import type { AskedQuestion } from "../../../core/socle/questionnaire-engine/question/asked/question";
import type {
  Answer,
  Answers,
  AnyCibles,
  Page,
  Unanswered,
  Validated,
} from "../../../core/socle/questionnaire-engine/question/question";
import {
  Questionnaire,
  type QuestionnaireState,
} from "../../../core/socle/questionnaire-engine/questionnaire";
import {
  isSingleChoicePage,
  useAutoAdvance,
  withRestart,
} from "./advance-alone";
import { actions, advance } from "./move-between-pages";
import { startingState } from "./resume-where-left";
import { useQuestionnaireTracking } from "./send-to-analytics";

export type QuestionnaireOptions = {
  // Les pages de ce questionnaire, dans l'ordre. Au moins une doit s'afficher.
  pages: readonly Page[];
  // Les réponses acquises avant ce questionnaire. Ses pages ne les reposent
  // pas : les conditions les lisent, rien ne les change. C'est le verrou.
  lockedAnswers?: Answers;
  // Les cibles figées au verrou. Les conditions des pages les lisent : une
  // question peut dépendre de la préconisation.
  cibles?: AnyCibles;
  // Ce qu'une question change de ce qui compte : une question qui ne change
  // rien ne se pose pas (#255). Sans elle, tout compte.
  relevance?: Relevance;
  // La reprise d'un questionnaire déjà mené, au retour d'une page de résultat.
  // Il rouvre sur sa page, réponses intactes, sans réémettre son début.
  initialState?: QuestionnaireState;
  // Le questionnaire émet-il ses évènements de mesure d'audience ?
  tracked: boolean;
  onComplete: (answers: Answers, state: QuestionnaireState) => void;
};

export type View = {
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

/** Le questionnaire tel qu'il est : ses réponses validées, sa page, son brouillon. */
export type State = QuestionnaireState & { readonly draft: Answers };

/** Ce qui dit quelles pages s'affichent : la liste, et les cibles s'il y en a. */
export type Source = Pick<
  QuestionnaireOptions,
  "pages" | "cibles" | "relevance"
>;

export function useQuestionnaire(
  options: QuestionnaireOptions,
): QuestionnaireScreen {
  const [state, setState] = useState<State>(() => startingState(options));
  const view = read(options, state);
  const tracking = useQuestionnaireTracking(
    view.pages.indexOf(view.page) + 1,
    options.tracked,
    options.initialState !== undefined,
  );
  const handlers = actions({ state, setState, view, options, tracking });
  const autoAdvance = useAutoAdvance(
    state.page,
    isSingleChoicePage(view.questions),
    view.hasPendingQuestions,
    handlers.next,
  );
  return { ...view, ...withRestart(handlers, autoAdvance) };
}

// ---- implémentation ----

// L'écran d'une page fait deux lectures : celle des réponses validées, qui
// dit les pages, et celle où le brouillon passe par-dessus, qui dit ce que la
// page pose. Une question peut ainsi en révéler une autre sur la même page.
function read(options: Source, state: State): View {
  const questionnaire = new Questionnaire(options.pages, options.relevance);
  const reading = questionnaire.readWith(state.answers, options.cibles);
  const pages = reading.askedPages();
  const page = pages.find((p) => p.id === state.page);
  if (!page) throw new Error(`La page « ${state.page} » ne s'affiche plus.`);
  const visible = { ...state.answers, ...state.draft };
  const questions = questionnaire
    .readWith(visible, options.cibles)
    .questionsOn(page);
  const hasPendingQuestions = questions.some(
    (question) => !question.isAnsweredBy(state.draft[question.id]),
  );
  return {
    page,
    pages,
    questions,
    draft: state.draft,
    answers: state.answers,
    validated: reading.validated.toJSON(),
    hasPrevious: pages.indexOf(page) > 0,
    hasPendingQuestions,
    isLast:
      !hasPendingQuestions &&
      advance(options, state, page).following === undefined,
  };
}
