// Ce que le socle de l'écran expose au reste de l'app : à `main.tsx`, de quoi
// la monter, et au modèle, de quoi composer ses résultats et son cerfa. Ce qui
// déclare les questions, les faits et les seeds vient du socle du métier,
// `core/socle/index.ts`.
//
// L'écran des seeds et son tableau n'y figurent pas : ils sont chargés à la
// demande, et les réexporter ici les ramènerait dans le chunk d'entrée.

export {
  type AnalyticsUseCases,
  analyticsUseCases,
  CmsConsent,
  configFromEnv,
  DiscardingAudience,
  HostPageLoad,
  loadMatomo,
  MatomoAudience,
  ServerJournal,
} from "./analytics";
export { App, type Models } from "./app";
export {
  at,
  bindCerfa,
  box,
  type Cerfa,
  type CerfaMapping,
  cerfaValue,
  commentOn,
  date,
  drawnBox,
  onOneLine,
  templateAt,
  text,
} from "./cerfa";
export { SHA_COMMIT, VERSION_APP } from "./deployed-version";
export {
  type AldIndicator,
  defineModel,
  type Feedback,
  type FirstResult,
  type Intent,
  type Portion,
  type ResultatProps,
  type ResultCodes,
  type Sheet,
} from "./model";
export { declarerAuServeur, referentielDuServeur } from "./rattachement";
export { ServerApiClient } from "./server-api";
export { applyTheme, followHostTheme } from "./theme";
export {
  Disclosure,
  type IllustratedCard,
  IllustratedCards,
  NumberedCards,
  NumberedSteps,
  Panel,
  SheetFollowUp,
} from "./ui";
