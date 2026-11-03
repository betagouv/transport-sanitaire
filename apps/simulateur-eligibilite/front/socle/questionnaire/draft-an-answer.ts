// Le brouillon d'une page : ses réponses telles qu'elles sont à l'écran. Elles
// ne comptent qu'une fois la page validée.

import type {
  Answer,
  Answers,
  Page,
  Question,
  Unanswered,
} from "../../../core/socle/questionnaire-engine/question/question";
import { answerOnPage } from "../../../core/socle/questionnaire-engine/validate-a-page";
import type { State } from "./questionnaire";

// Ouvrir une page copie ses réponses validées dans le brouillon. Elle rouvre
// ainsi telle qu'on l'a quittée. Un « Précédent » sans validation abandonne
// ce brouillon. Une case seule sans réponse y part décochée : sans y toucher,
// on valide la page, et les questions qui la suivent se révèlent.
export function onPage(page: Page, answers: Answers): State {
  const draft = Object.fromEntries(
    page.questions.flatMap((question) => {
      const answer = answers[question.id] ?? unchecked(question);
      return answer === undefined ? [] : [[question.id, answer]];
    }),
  );
  return { answers, page: page.id, draft };
}

// Une saisie vide les questions de la page qui en dépendent (`dependsOn`).
export function withAnswer(
  state: State,
  page: Page,
  id: string,
  answer: Answer | Unanswered,
): State {
  return { ...state, draft: answerOnPage(page, state.draft, id, answer) };
}

// ---- implémentation ----

function unchecked(question: Question): Answer | Unanswered {
  return question.kind === "checkbox" ? false : undefined;
}
