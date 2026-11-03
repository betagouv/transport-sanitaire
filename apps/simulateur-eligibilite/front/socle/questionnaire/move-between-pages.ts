// Avancer et revenir : la page validée laisse ses réponses et dit celle qui la
// suit ; reculer ne valide rien.

import type { Page } from "../../../core/socle/questionnaire-engine/question/question";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";
import { onPage, withAnswer } from "./draft-an-answer";
import type {
  Actions,
  QuestionnaireOptions,
  Source,
  State,
  View,
} from "./questionnaire";
import type { QuestionnaireTracking } from "./send-to-analytics";

type Context = {
  state: State;
  setState: (state: State) => void;
  view: View;
  options: QuestionnaireOptions;
  tracking: QuestionnaireTracking;
};

// La page validée : les réponses qu'elle laisse, et la page qui la suit.
export function advance(
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

export function actions({
  state,
  setState,
  view,
  options,
  tracking,
}: Context): Actions {
  return {
    answer: (id, answer) => setState(withAnswer(state, view.page, id, answer)),
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
