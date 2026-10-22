// Ce que le socle du métier promet à un modèle : de quoi déclarer ses
// questions, ses faits et ses seeds, et lire des réponses. Un modèle n'importe
// rien d'autre de `core/socle/`, sauf le moteur de décision : passer par ici
// amènerait publicodes dans le chunk d'entrée.
//
// L'écran a son propre point d'entrée, `front/socle/index.ts`.

export { Fait } from "./decision-engine/fait.ts";
export { faitsOf } from "./decision-engine/fait-builder.ts";
export type { CoreModel } from "./model.ts";
export type { Address } from "./questionnaire-engine/address.ts";
export type { AskedQuestion } from "./questionnaire-engine/asked-question.ts";
export type {
  GivenAnswer,
  GivenAnswers,
} from "./questionnaire-engine/given-answers.ts";
export type {
  Answers,
  QuestionnairePart,
} from "./questionnaire-engine/question.ts";
export type { QuestionContext } from "./questionnaire-engine/question-context.ts";
export { questionsOf } from "./questionnaire-engine/question-factory.ts";
export { Questionnaire } from "./questionnaire-engine/questionnaire.ts";
export type { ValidatedAnswers } from "./questionnaire-engine/validated-answers.ts";
export type { Seed } from "./seeds/seed.ts";
