// Un questionnaire : ses pages, dans l'ordre. Des réponses s'y lisent
// (`readWith`) : elles donnent un questionnaire répondu
// (`answered-questionnaire.vo.ts`).

import { AnsweredQuestionnaire } from "./answered-questionnaire.vo.ts";
import { answersOf, GivenAnswers } from "./answers/given-answers.vo.ts";
import { QuestionPositions } from "./conditions/question-positions.vo.ts";
import { Reads } from "./conditions/reads.vo.ts";
import type { Relevance } from "./does-a-question-still-matter/relevance.service.ts";
import type {
  Answers,
  AnyCibles,
  AnyQuestions,
  Page,
  QuestionnairePart,
} from "./question/question.types.ts";

/**
 * Un questionnaire : ses pages, dans l'ordre. `Questions` : celles du modèle,
 * pour lire ses réponses typées. Une question à plusieurs places mal déclarée
 * l'arrête dès sa construction (`QuestionPositions`).
 */
export class Questionnaire<Questions extends AnyQuestions = AnyQuestions> {
  readonly pages: readonly Page[];
  /** Ce qu'une question change de ce qui compte. Sans elle, tout compte. */
  readonly relevance?: Relevance;
  /** Où se trouve chaque question, à chacune de ses places. */
  readonly positions: QuestionPositions;

  constructor(pages: readonly Page[], relevance?: Relevance) {
    this.pages = pages;
    this.positions = new QuestionPositions(pages);
    if (relevance) this.relevance = relevance;
  }

  /** Les pages de ces parties, dans l'ordre du questionnaire. */
  static pagesOf(parts: readonly QuestionnairePart[]): Page[] {
    return parts.flatMap((part) => part.pages);
  }

  /**
   * Ce que lit sa complétude : ses questions, et ce que lisent leurs gardes,
   * qui décident si chacune se pose.
   */
  get reads(): Reads {
    const questions = this.pages.flatMap((page) => page.questions);
    return Reads.union(
      ...questions.map(({ id, guardReads }) =>
        Reads.ofQuestion(id).with(guardReads),
      ),
    );
  }

  /**
   * Ces réponses, lues à travers ce questionnaire. `cibles` : celles que le
   * verrou a figées, que lisent les questions d'après lui.
   */
  readWith(
    answers: Answers<Questions> | GivenAnswers<Questions>,
    cibles?: AnyCibles,
  ): AnsweredQuestionnaire<Questions> {
    const given =
      answers instanceof GivenAnswers ? answersOf(answers) : answers;
    return new AnsweredQuestionnaire(this, given, cibles);
  }
}
