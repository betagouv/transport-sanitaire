// La page qu'ouvre une transition de la simulation, et ce qu'elle garde d'une
// correction : la correction encore en cours, ou le brouillon que la page
// d'origine retrouve à la fin (`answer-correction.vo.ts`).

import type {
  AnsweredQuestionnaire,
  Answers,
  Page,
} from "../questionnaire-engine/index.ts";
import type { AnswerCorrection } from "./answer-correction.vo.ts";
import { StagePages } from "./stage-pages.vo.ts";

/** La transition n'ouvre aucune page de l'étape : elle s'achève. */
export type StageEnds = undefined;

/** Aucun brouillon à garder. */
type NoDraft = undefined;

/** Un brouillon gardé, et la page à qui il revient. */
export type KeptDraft = { readonly page: Page; readonly draft: Answers };

export class PageOpening {
  readonly page: Page;
  readonly correction: AnswerCorrection | undefined;
  /** Le brouillon que la page retrouve : celui d'avant la correction. */
  readonly draft: Answers | undefined;

  constructor(page: Page, correction?: AnswerCorrection, draft?: Answers) {
    this.page = page;
    this.correction = correction;
    this.draft = draft;
  }

  /**
   * La page qu'ouvre la validation de celle-ci, sur ces réponses relues :
   * celle où reprend une correction en cours, sinon la suivante. Aucune :
   * l'étape s'achève. `declared` : les pages déclarées avant le verrou.
   */
  next(
    reading: AnsweredQuestionnaire,
    declared: readonly Page[],
  ): PageOpening | StageEnds {
    const { correction } = this;
    if (correction)
      return correction.resumeOn(StagePages.of(reading), reading, declared);
    const following = reading.pageAfter(this.page);
    return following && new PageOpening(following);
  }

  /** Le brouillon gardé : celui de la correction, qui suit son origine, ou le sien. */
  keptDraft(): KeptDraft | NoDraft {
    const { correction, draft, page } = this;
    if (correction) return { page: correction.origin, draft: correction.draft };
    return draft ? { page, draft } : undefined;
  }
}
