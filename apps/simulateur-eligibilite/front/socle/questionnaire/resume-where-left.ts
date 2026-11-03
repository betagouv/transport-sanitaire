// Où le questionnaire s'ouvre : sans reprise, là où ses réponses le laissent,
// sur la première page qui attend une réponse ; en reprise, sur la page
// quittée, réponses intactes.

import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";
import { onPage } from "./draft-an-answer";
import type { QuestionnaireOptions, State } from "./questionnaire";

export function startingState(options: QuestionnaireOptions): State {
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
