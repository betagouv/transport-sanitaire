// Ce que le socle du métier promet à un modèle : de quoi déclarer ses
// questions, ses faits et ses seeds, et lire des réponses. Un modèle n'importe
// rien d'autre de `core/socle/`, sauf le moteur de décision : passer par ici
// amènerait publicodes dans le chunk d'entrée.
//
// L'écran a son propre point d'entrée, `front/socle/index.ts`.

export {
  Cible,
  cibleValues,
  type DecisionGraphData,
  Fait,
  FaitCatalogue,
  type FaitDeclare,
  uneRegle,
  unFait,
} from "./decision-engine/index.ts";

export type { CoreModel } from "./model.ts";
export type {
  GivenAnswer,
  GivenAnswers,
} from "./questionnaire-engine/answers/given-answers.ts";
export type { ValidatedAnswers } from "./questionnaire-engine/answers/validated-answers.ts";
export {
  type Condition,
  constant,
  type Value,
  type ValueOf,
} from "./questionnaire-engine/conditions/condition.ts";
export { givenOf } from "./questionnaire-engine/conditions/given.ts";
export { Relevance } from "./questionnaire-engine/does-a-question-still-matter/matters.ts";
export type { Address } from "./questionnaire-engine/question/address.ts";
export type { QuestionContext } from "./questionnaire-engine/question/asked/context.ts";
export { questionsOf } from "./questionnaire-engine/question/declared/factory.ts";
export {
  type DeclaredPage,
  page,
} from "./questionnaire-engine/question/declared/page.ts";
export {
  type Answered,
  type AnswerOf,
  type AnswersOf,
  afterLock,
  type ReadByObject,
  type Unanswered,
} from "./questionnaire-engine/question/question.ts";
export { Questionnaire } from "./questionnaire-engine/questionnaire.ts";
export type { Seed } from "./simulation/seed.ts";
