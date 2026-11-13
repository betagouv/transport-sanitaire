// Une page ne se valide qu'entière et cohérente, quel que soit l'appelant :
// l'écran, mais aussi un appel direct au moteur (NAV-SOUS-QUESTIONS-20261113,
// SQ-30). Le refus dit quelles questions sont en faute, et pourquoi.

import {
  type AnswerProblem,
  type Answers,
  MISSING,
  type Page,
  type Reading,
} from "../questionnaire-engine/index.ts";

/** Une question en faute, et ce qui ne va pas dans sa réponse. */
export type Fault = {
  readonly question: string;
  readonly problems: readonly AnswerProblem[];
};

/** La page ne se valide pas : une réponse y manque, ou se contredit. */
export class PageRefused extends Error {
  readonly page: string;
  readonly faults: readonly Fault[];

  constructor(page: string, faults: readonly Fault[]) {
    const questions = faults.map(({ question }) => question).join(", ");
    super(`La page ${page} ne se valide pas : ${questions}.`);
    this.name = "PageRefused";
    this.page = page;
    this.faults = faults;
  }
}

/** Refuse la page si ce brouillon y laisse une question sans sa réponse. */
export function refuseUnlessAnswered(
  reading: Reading,
  page: Page,
  draft: Answers,
): void {
  const faults = reading
    .withDraft(page, draft)
    .questionsOn(page)
    .filter((question) => !question.isAnsweredBy(draft[question.id]))
    .map((question) => {
      const problems = question.problemsWith(draft[question.id]);
      const stated = problems.length > 0 ? problems : [MISSING];
      return { question: question.id, problems: stated };
    });
  if (faults.length > 0) throw new PageRefused(page.id, faults);
}
