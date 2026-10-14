// L'état d'un questionnaire : la page ouverte, son brouillon, ce qu'il reste à
// répondre, et la navigation entre les pages.

import { useState } from "react";
import {
  askedPages,
  askedQuestions,
  validatedQuestions,
} from "./asked-questions";
import type { AutoAdvance } from "./auto-advance";
import { useAutoAdvance } from "./auto-advance";
import { isAnswered, offeredAnswer } from "./offered-answer";
import { commitPage } from "./page-commit";
import type {
  Answer,
  Answers,
  AnyCibles,
  Page,
  Question,
  Validated,
} from "./question";
import type { QuestionnaireTracking } from "./questionnaire-tracking";
import { useQuestionnaireTracking } from "./questionnaire-tracking";

/** Où en est un questionnaire : ses réponses validées, et la page ouverte. */
export type QuestionnaireState = {
  readonly answers: Answers;
  readonly page: string;
};

export type QuestionnaireOptions = {
  // Les pages de ce questionnaire, dans l'ordre. Au moins une doit s'afficher.
  pages: readonly Page[];
  // Les réponses acquises avant ce questionnaire. Ses pages ne les reposent
  // pas : les conditions les lisent, rien ne les change. C'est le verrou.
  lockedAnswers?: Answers;
  // Les cibles figées au verrou. Les conditions des pages les lisent : une
  // question peut dépendre de la préconisation.
  cibles?: AnyCibles;
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
  questions: readonly Question[];
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
  answer: (id: string, answer: Answer | undefined) => void;
  next: () => void;
  back: () => void;
};

export type Questionnaire = View &
  Actions & {
    // La page avancera d'elle-même : le bouton « Suivant » n'a pas à s'afficher.
    autoAdvances: boolean;
  };

export function useQuestionnaire(options: QuestionnaireOptions): Questionnaire {
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

/**
 * L'état qu'aurait laissé un utilisateur ayant donné ces réponses : ouvert sur
 * la première page sans réponse, sinon sur la dernière. Une seed a ainsi un
 * questionnaire derrière elle, donc un « Précédent ».
 */
export function stateAfterAnswers(
  pages: readonly Page[],
  answers: Answers,
  cibles?: AnyCibles,
): QuestionnaireState & { complete: boolean } {
  const asked = askedPages(pages, answers, cibles);
  const pending = asked.find((page) =>
    askedQuestions(pages, page, answers, cibles).some(
      (question) => !isAnswered(question, answers[question.id]),
    ),
  );
  const open = pending ?? asked.at(-1);
  if (!open) throw new Error("Ce questionnaire n'affiche aucune page.");
  return { answers, page: open.id, complete: pending === undefined };
}

// ---- implémentation ----

type State = QuestionnaireState & { readonly draft: Answers };

// Ce qui dit quelles pages s'affichent : la liste, et les cibles s'il y en a.
type Source = Pick<QuestionnaireOptions, "pages" | "cibles">;

type Context = {
  state: State;
  setState: (state: State) => void;
  view: View;
  options: QuestionnaireOptions;
  tracking: QuestionnaireTracking;
};

function startingState(options: QuestionnaireOptions): State {
  const answers = options.initialState?.answers ?? options.lockedAnswers;
  const start =
    options.initialState ??
    stateAfterAnswers(options.pages, answers ?? {}, options.cibles);
  const page = options.pages.find((p) => p.id === start.page);
  if (!page) throw new Error(`Page inconnue : « ${start.page} ».`);
  return onPage(page, start.answers);
}

// Ouvrir une page copie ses réponses validées dans le brouillon. Elle rouvre
// ainsi telle qu'on l'a quittée. Un « Précédent » sans validation abandonne
// ce brouillon.
function onPage(page: Page, answers: Answers): State {
  const draft = Object.fromEntries(
    page.questions
      .filter((question) => answers[question.id] !== undefined)
      .map((question) => [question.id, answers[question.id] as Answer]),
  );
  return { answers, page: page.id, draft };
}

function read(options: Source, state: State): View {
  const { pages: all, cibles } = options;
  const pages = askedPages(all, state.answers, cibles);
  const page = pages.find((p) => p.id === state.page);
  if (!page) throw new Error(`La page « ${state.page} » ne s'affiche plus.`);
  const questions = askedQuestions(all, page, visibleAnswers(state), cibles);
  const hasPendingQuestions = questions.some(
    (question) => !isAnswered(question, drafted(question, state.draft)),
  );
  return {
    page,
    pages,
    questions,
    draft: state.draft,
    answers: state.answers,
    validated: validatedQuestions(all, state.answers, cibles),
    hasPrevious: pages.indexOf(page) > 0,
    hasPendingQuestions,
    isLast:
      !hasPendingQuestions &&
      nextPage(options, page, committedAnswers(options, state, page)) ===
        undefined,
  };
}

// Ce que les conditions lisent : les réponses validées, puis celles de la
// page en cours par-dessus. Une question peut ainsi en révéler une autre sur
// la même page.
function visibleAnswers(state: State): Answers {
  return { ...state.answers, ...state.draft };
}

// Les réponses du questionnaire, la page courante validée. Une question que la
// page ne pose plus n'y laisse pas de réponse, ni une option qu'elle ne propose
// plus.
function committedAnswers(
  { pages, cibles }: Source,
  state: State,
  page: Page,
): Answers {
  const asked = askedQuestions(pages, page, visibleAnswers(state), cibles);
  const inputs = asked.flatMap((question) => {
    const answer = offeredAnswer(question, drafted(question, state.draft));
    return answer === undefined ? [] : [[question.id, answer] as const];
  });
  return commitPage(pages, state.answers, page, Object.fromEntries(inputs));
}

function nextPage(source: Source, page: Page, answers: Answers) {
  const pages = askedPages(source.pages, answers, source.cibles);
  return pages[pages.findIndex((p) => p.id === page.id) + 1];
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
      const answers = committedAnswers(options, state, view.page);
      const following = nextPage(options, view.page, answers);
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

// La réponse du brouillon à cette question. Une case seule qu'on n'a pas
// touchée est décochée : la page se valide, et la case vaut `false`.
function drafted(question: Question, draft: Answers): Answer | undefined {
  const answer = draft[question.id];
  return question.kind === "checkbox" ? (answer ?? false) : answer;
}

function withAnswer(
  draft: Answers,
  id: string,
  answer: Answer | undefined,
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
    answer: (id: string, answer: Answer | undefined) => {
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
function isSingleChoicePage(questions: readonly Question[]): boolean {
  return questions.length > 0 && questions.every(advancesAlone);
}

function advancesAlone(question: Question): boolean {
  return (
    question.kind === "single choice" &&
    !question.optional &&
    !question.dropdown
  );
}
