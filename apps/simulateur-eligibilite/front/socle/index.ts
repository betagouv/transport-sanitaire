// Ce que le socle de l'écran expose au reste de l'app : à `main.tsx`, de quoi
// la monter, et au modèle, de quoi composer ses résultats et son cerfa. Ce qui
// déclare les questions, les faits et les seeds vient du socle du métier,
// `core/socle/index.ts`.
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
export {
  at,
  box,
  type Cerfa,
  commentOn,
  date,
  drawnBox,
  onOneLine,
  text,
} from "./cerfa/cerfa";
export { templateAt } from "./cerfa/generate-cerfa";
export { bindCerfa, type CerfaMapping, cerfaValue } from "./cerfa-mapping";
export {
  defineModel,
  type Feedback,
  type FirstResult,
  type Intent,
  type ResultatProps,
  type Sheet,
} from "./model";
export { Disclosure } from "./ui/Disclosure";
export { type IllustratedCard, IllustratedCards } from "./ui/IllustratedCards";
export { NumberedCards } from "./ui/NumberedCards";
export { NumberedSteps } from "./ui/NumberedSteps";
export { Panel } from "./ui/Panel";
export { SheetFollowUp } from "./ui/SheetFollowUp";
