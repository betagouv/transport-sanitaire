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
  date,
  drawnBox,
  type StrictOptions,
  strictDrawing,
  strictText,
  templateAt,
  text,
} from "./cerfa";
export { VERSION_APP } from "./deployed-version";
export { ModelFactory } from "./model.factory";
export type {
  AldIndicator,
  Feedback,
  FirstResult,
  Intent,
  Mode,
  ResultatProps,
  ResultCodes,
  Sheet,
  TransportComposition,
  TypographicFieldId,
} from "./model.types";
export { referentielDuServeur } from "./rattachement";
export { ServerApiClient } from "./server-api";
export { ApplyThemeService, HostThemeService } from "./theme";
export {
  Disclosure,
  type IllustratedCard,
  IllustratedCards,
  NumberedCards,
  NumberedSteps,
  Panel,
  SheetFollowUp,
} from "./ui";
