// Ce que le socle du métier promet à un modèle : de quoi déclarer ses
// questions, ses faits et ses seeds, et lire des réponses. Un modèle n'importe
// rien d'autre de `core/socle/`, sauf le moteur de décision : passer par ici
// amènerait publicodes dans le chunk d'entrée.
//
// L'écran a son propre point d'entrée, `front/socle/index.ts`.

export { Cible, cibleValues } from "./decision-engine/cible.ts";
export type { DecisionGraphData } from "./decision-engine/decision-graph.ts";
export { Fait } from "./decision-engine/fait.ts";
export { type FaitDeclare, unFait } from "./decision-engine/fait-builder.ts";
export { FaitCatalogue } from "./decision-engine/fait-catalogue.ts";
export { uneRegle } from "./decision-engine/regle-de-fait.ts";
export type { CoreModel } from "./model.ts";
export type { Address } from "./questionnaire-engine/address.ts";
export {
  type Condition,
  constant,
  type Value,
  type ValueOf,
} from "./questionnaire-engine/condition.ts";
export { page } from "./questionnaire-engine/declared-page.ts";
export { givenOf } from "./questionnaire-engine/given.ts";
export type {
  GivenAnswer,
  GivenAnswers,
} from "./questionnaire-engine/given-answers.ts";
export {
  afterLock,
  type QuestionnairePart,
  type Unanswered,
} from "./questionnaire-engine/question.ts";
export type { QuestionContext } from "./questionnaire-engine/question-context.ts";
export { questionsOf } from "./questionnaire-engine/question-factory.ts";
export { Questionnaire } from "./questionnaire-engine/questionnaire.ts";
export { Relevance } from "./questionnaire-engine/relevance.ts";
export type { ValidatedAnswers } from "./questionnaire-engine/validated-answers.ts";
export type { Seed } from "./seeds/seed.ts";
