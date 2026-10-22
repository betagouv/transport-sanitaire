// Ce que le socle expose au reste de l'app : à `main.tsx`, de quoi la monter, et au
// modèle, de quoi s'écrire. Le modèle n'importe rien d'autre du socle, sauf le
// type d'une seed, que son catalogue lit à la source.
//
// L'écran des seeds et son tableau n'y figurent pas : ils sont chargés à la
// demande, et les réexporter ici les ramènerait dans le chunk d'entrée.

export {
  chargerMatomo,
  configDepuisEnv,
  initAnalytics,
} from "./analytics/matomo";
export { App } from "./app/App";
export type { Models } from "./app/model-choice";
export { at, type Cerfa, commentOn, drawnBox, text } from "./cerfa/cerfa";
export { templateAt } from "./cerfa/generate-cerfa";
export { bindCerfa, type CerfaMapping } from "./cerfa-mapping";
export { Fait } from "./decision-engine/fait";
export {
  type CerfaInput,
  defineModel,
  type FirstResult,
  type Sheet,
} from "./model";
export type { Address } from "./questionnaire-engine/address";
export { areAnswered } from "./questionnaire-engine/asked-questions";
export type {
  GivenAnswer,
  GivenAnswers,
} from "./questionnaire-engine/given-answers";
export { optionsFrom } from "./questionnaire-engine/option";
export type { QuestionnairePart } from "./questionnaire-engine/question";
export { questionsOf } from "./questionnaire-engine/question-factory";
export type { ValidatedAnswers } from "./questionnaire-engine/validated-answers";
export { Disclosure } from "./ui/Disclosure";
export { type IllustratedCard, IllustratedCards } from "./ui/IllustratedCards";
export { NumberedCards } from "./ui/NumberedCards";
export { Panel } from "./ui/Panel";
export { SheetFollowUp } from "./ui/SheetFollowUp";
