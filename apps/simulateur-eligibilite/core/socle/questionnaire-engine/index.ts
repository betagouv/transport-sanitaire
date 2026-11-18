// Ce que le moteur de questionnaire promet au reste du socle : déclarer des
// pages et des questions, lire des réponses (`Questionnaire`, `AnsweredQuestionnaire`), les
// conditions et le contexte où elles se lisent, les questions qui comptent.

export type { AnsweredQuestionnaire } from "./answered-questionnaire.vo.ts";
export type {
  Box,
  Choice,
  GivenAnswer,
  GivenAnswers,
} from "./answers/given-answers.vo.ts";
export {
  type ValidatedAnswer,
  ValidatedAnswers,
} from "./answers/validated-answers.vo.ts";
export { LocalDateTime } from "./conditions/local-date-time.vo.ts";
export { ReadingFactory } from "./conditions/reading.factory.ts";
export {
  type Condition,
  type Context,
  Reading,
  type ValueOf,
} from "./conditions/reading.vo.ts";
export { Reads } from "./conditions/reads.vo.ts";
export { Relevance } from "./does-a-question-still-matter/relevance.service.ts";
export { PageCommitService } from "./page-commit.service.ts";
export {
  Address,
  type AddressData,
  type AddressFieldName,
} from "./question/address.vo.ts";
export type {
  AskedAddress,
  AskedField,
} from "./question/asked/address.vo.ts";
export {
  type AnswerProblem,
  MISSING,
} from "./question/asked/answer-problem.vo.ts";
export type { Revisit, ShownUnder } from "./question/asked/common.vo.ts";
export { QuestionContext } from "./question/asked/context.vo.ts";
export {
  type AskedQuestion,
  askedQuestion,
} from "./question/asked/question.vo.ts";
export {
  afterLock,
  type DeclaredPage,
  page,
} from "./question/declared/page.vo.ts";
export { QuestionFactory } from "./question/declared/question.factory.ts";
export type {
  Answer,
  Answered,
  AnswerOf,
  Answers,
  AnswersOf,
  AnyCibles,
  AnyQuestions,
  Page,
  Question,
  QuestionnairePart,
  ReadByObject,
  Unanswered,
  Validated,
} from "./question/question.types.ts";
export { Questionnaire } from "./questionnaire.vo.ts";
