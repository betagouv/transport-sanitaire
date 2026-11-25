// Ce que le socle du métier promet à un modèle : de quoi déclarer ses
// questions, ses faits et ses seeds, et lire des réponses. Un modèle n'importe
// rien d'autre de `core/socle/`, sauf le moteur de décision : passer par ici
// amènerait publicodes dans le chunk d'entrée.
//
// L'écran a son propre point d'entrée, `front/socle/index.ts`.

export {
  type CerfaDto,
  CerfaDtoService,
  type CerfaMapping,
} from "./cerfa/index.ts";
export {
  Cible,
  type DecisionGraphData,
  Fait,
  FaitCatalogue,
  type FaitDeclare,
  uneRegle,
  unFait,
} from "./decision-engine/index.ts";

export type { CoreModel, Intent } from "./model.types.ts";
export {
  type AddressData,
  type Answered,
  type AnswerOf,
  type AnswersOf,
  afterLock,
  type Condition,
  type DeclaredPage,
  type GivenAnswer,
  type GivenAnswers,
  LocalDateTime,
  page,
  type QuestionContext,
  QuestionFactory,
  Questionnaire,
  type ReadByObject,
  Reading,
  ReadingFactory,
  Relevance,
  type Revisit,
  type Unanswered,
  type ValidatedAnswers,
  type ValueOf,
} from "./questionnaire-engine/index.ts";

export type { Seed } from "./simulation/index.ts";
