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
export {
  type Address,
  type Answered,
  type AnswerOf,
  type AnswersOf,
  afterLock,
  type Condition,
  constant,
  type DeclaredPage,
  type GivenAnswer,
  type GivenAnswers,
  givenOf,
  page,
  type QuestionContext,
  Questionnaire,
  questionsOf,
  type ReadByObject,
  Relevance,
  type Unanswered,
  type ValidatedAnswers,
  type Value,
  type ValueOf,
} from "./questionnaire-engine/index.ts";

export type { Seed } from "./simulation/index.ts";
