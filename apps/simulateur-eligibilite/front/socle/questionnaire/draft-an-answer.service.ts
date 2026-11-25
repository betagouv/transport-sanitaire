// Le brouillon d'une page : ses réponses telles qu'elles sont à l'écran. Elles
// ne comptent qu'une fois la page validée.

import type {
  Answer,
  Answers,
  Page,
  Question,
  Unanswered,
} from "../../../core/socle/questionnaire-engine";

export class DraftAnAnswerService {
  // Ouvrir une page copie ses réponses validées dans le brouillon. Elle rouvre
  // ainsi telle qu'on l'a quittée. Un « Précédent » sans validation abandonne
  // ce brouillon. Une case seule sans réponse y part décochée : sans y toucher,
  // on valide la page, et les questions qui la suivent se révèlent.
  static draftOf(page: Page, answers: Answers): Answers {
    return Object.fromEntries(
      page.questions.flatMap((question) => {
        const answer =
          answers[question.id] ?? DraftAnAnswerService.#unchecked(question);
        return answer === undefined ? [] : [[question.id, answer]];
      }),
    );
  }

  static #unchecked(question: Question): Answer | Unanswered {
    return question.kind === "checkbox" ? false : undefined;
  }
}
