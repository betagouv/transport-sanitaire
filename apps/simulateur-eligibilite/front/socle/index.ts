// Ce que le socle de l'écran expose au reste de l'app : à `main.tsx`, de quoi
// la monter, et au modèle, de quoi composer ses résultats et son cerfa. Ce qui
// déclare les questions, les faits et les seeds vient du socle du métier,
// `core/socle/index.ts`.
//
// L'écran des seeds et son tableau n'y figurent pas : ils sont chargés à la
// demande, et les réexporter ici les ramènerait dans le chunk d'entrée.

export { configFromEnv, initAnalytics, loadMatomo } from "./analytics";
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
  templateAt,
  text,
} from "./cerfa/cerfa";
export {
  bindCerfa,
  type CerfaMapping,
  cerfaValue,
} from "./cerfa/generate-the-cerfa/compute-the-dto";
export {
  type AldIndicator,
  defineModel,
  type Feedback,
  type FirstResult,
  type Intent,
  type ResultatProps,
  type Sheet,
} from "./model";
export {
  Disclosure,
  type IllustratedCard,
  IllustratedCards,
  NumberedCards,
  NumberedSteps,
  Panel,
  SheetFollowUp,
} from "./ui";
