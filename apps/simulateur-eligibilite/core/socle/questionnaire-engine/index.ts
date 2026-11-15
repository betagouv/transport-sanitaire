// Ce que le moteur de questionnaire promet au reste du socle : déclarer des
// pages et des questions, lire des réponses (`Questionnaire`, `Reading`), les
// conditions et leur périmètre, ce qu'une question change.

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
export {
  type Condition,
  constant,
  type Read,
  readIn,
  type Scope,
  Value,
  type ValueOf,
} from "./conditions/condition.ts";
export { givenOf } from "./conditions/given.ts";
export { LocalDateTime } from "./conditions/local-date-time.vo.ts";
export { Reads } from "./conditions/reads.vo.ts";
export { faitsChangedBy } from "./does-a-question-still-matter/faits-changed-by.ts";
export { Relevance } from "./does-a-question-still-matter/matters.ts";
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
export type { Revisit } from "./question/asked/common.vo.ts";
export type { QuestionContext } from "./question/asked/context.ts";
export {
  type AskedQuestion,
  askedQuestion,
} from "./question/asked/question.vo.ts";
export { questionsOf } from "./question/declared/factory.ts";
export { type DeclaredPage, page } from "./question/declared/page.vo.ts";
export {
  type Answer,
  type Answered,
  type AnswerOf,
  type Answers,
  type AnswersOf,
  type AnyCibles,
  type AnyQuestions,
  afterLock,
  type Page,
  pagesOf,
  type Question,
  type QuestionnairePart,
  type ReadByObject,
  type Unanswered,
  type Validated,
} from "./question/question.ts";
export { Questionnaire, type Reading } from "./questionnaire.ts";
export { answerOnPage, commitPage } from "./validate-a-page.ts";
