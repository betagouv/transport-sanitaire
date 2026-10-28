// Le questionnaire à l'écran : la page ouverte, son brouillon, ce qu'il reste
// à répondre, et la navigation entre les pages.

import { useState } from "react";
import type { AskedQuestion } from "../../../core/socle/questionnaire-engine/asked-question";
import type {
  Answer,
  Answers,
  AnyCibles,
  Page,
  Question,
  Unanswered,
  Validated,
} from "../../../core/socle/questionnaire-engine/question";
import {
  Questionnaire,
  type QuestionnaireState,
} from "../../../core/socle/questionnaire-engine/questionnaire";
import type { Relevance } from "../../../core/socle/questionnaire-engine/relevance";
import type { AutoAdvance } from "./auto-advance";
import { useAutoAdvance } from "./auto-advance";
import type { QuestionnaireTracking } from "./questionnaire-tracking";
import { useQuestionnaireTracking } from "./questionnaire-tracking";

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

type Actions = {
  answer: (id: string, answer: Answer | Unanswered) => void;
  next: () => void;
  back: () => void;
};

export type QuestionnaireScreen = View &
  Actions & {
    // La page avancera d'elle-même : le bouton « Suivant » n'a pas à s'afficher.
    autoAdvances: boolean;
  };

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

type State = QuestionnaireState & { readonly draft: Answers };

// Ce qui dit quelles pages s'affichent : la liste, et les cibles s'il y en a.
type Source = Pick<QuestionnaireOptions, "pages" | "cibles" | "relevance">;

type Context = {
  state: State;
  setState: (state: State) => void;
  view: View;
  options: QuestionnaireOptions;
  tracking: QuestionnaireTracking;
};

// Sans reprise, le questionnaire s'ouvre là où ses réponses le laissent : sur
// la première page qui attend une réponse.
function startingState(options: QuestionnaireOptions): State {
  const { pages, cibles, relevance, initialState: resume } = options;
  if (!resume) {
    const answers = options.lockedAnswers ?? {};
    const questionnaire = new Questionnaire(pages, relevance);
    const reading = questionnaire.readWith(answers, cibles);
    return onPage(reading.openPage(), answers);
  }
  const page = pages.find((p) => p.id === resume.page);
  if (!page) throw new Error(`Page inconnue : « ${resume.page} ».`);
  return onPage(page, resume.answers);
}

// Ouvrir une page copie ses réponses validées dans le brouillon. Elle rouvre
// ainsi telle qu'on l'a quittée. Un « Précédent » sans validation abandonne
// ce brouillon. Une case seule sans réponse y part décochée : sans y toucher,
// on valide la page, et les questions qui la suivent se révèlent.
function onPage(page: Page, answers: Answers): State {
  const draft = Object.fromEntries(
    page.questions.flatMap((question) => {
      const answer = answers[question.id] ?? unchecked(question);
      return answer === undefined ? [] : [[question.id, answer]];
    }),
  );
  return { answers, page: page.id, draft };
}

function unchecked(question: Question): Answer | Unanswered {
  return question.kind === "checkbox" ? false : undefined;
}

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

// La page validée : les réponses qu'elle laisse, et la page qui la suit.
function advance(
  { pages, cibles, relevance }: Source,
  state: State,
  page: Page,
) {
  const questionnaire = new Questionnaire(pages, relevance);
  const answers = questionnaire
    .readWith(state.answers, cibles)
    .commit(page, state.draft);
  const following = questionnaire.readWith(answers, cibles).pageAfter(page);
  return { answers, following };
}

function actions({
  state,
  setState,
  view,
  options,
  tracking,
}: Context): Actions {
  return {
    answer: (id, answer) =>
      setState({ ...state, draft: withAnswer(state.draft, id, answer) }),
    next: () => {
      // Le bouton est déjà désactivé, ceci couvre une soumission au clavier.
      if (view.hasPendingQuestions) return;
      const { answers, following } = advance(options, state, view.page);
      if (!following) {
        tracking.questionnaireCompleted();
        return options.onComplete(answers, { answers, page: view.page.id });
      }
      setState(onPage(following, answers));
      tracking.stepPassed(view.pages.indexOf(view.page) + 2);
    },
    // Reculer ne valide rien. Le brouillon de la page quittée est abandonné, et
    // la page précédente rouvre sur ses réponses validées.
    back: () => {
      const previous = view.pages[view.pages.indexOf(view.page) - 1];
      if (previous) setState(onPage(previous, state.answers));
    },
  };
}

function withAnswer(
  draft: Answers,
  id: string,
  answer: Answer | Unanswered,
): Answers {
  const { [id]: _removed, ...rest } = draft;
  return answer === undefined ? rest : { ...rest, [id]: answer };
}

// Toute saisie relance l'avancement automatique, même au retour sur une page
// déjà répondue, où le bouton « Suivant » était revenu.
function withRestart(handlers: Actions, autoAdvance: AutoAdvance) {
  return {
    ...handlers,
    autoAdvances: autoAdvance.autoAdvances,
    answer: (id: string, answer: Answer | Unanswered) => {
      autoAdvance.onInput();
      handlers.answer(id, answer);
    },
  };
}

// L'avancement automatique vaut pour les pages faites de choix uniques. Avec
// un seul choix multiple ou champ de saisie, toute la page garde son bouton :
// on n'avance pas une page à moitié remplie. Une question facultative le garde
// aussi : sinon la page partirait avant qu'on ait pu y répondre. De même une
// liste déroulante, qu'on parcourt au clavier en changeant de valeur.
function isSingleChoicePage(questions: readonly AskedQuestion[]): boolean {
  return questions.length > 0 && questions.every(advancesAlone);
}

function advancesAlone(question: AskedQuestion): boolean {
  return (
    question.kind === "single choice" &&
    !question.optional &&
    !question.dropdown
  );
}
