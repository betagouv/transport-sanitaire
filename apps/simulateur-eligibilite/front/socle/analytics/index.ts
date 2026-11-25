// Ce que la mesure d'audience et le journal des parcours promettent au reste de
// l'écran : leurs use cases et adaptateurs, que le conteneur assemble, et les
// hooks qui traduisent les événements de l'écran en appels de use case.

export { useAldResultReached } from "./ald-pathway.hook";
export { type AldVerdict, EventName } from "./audience-event.entity";
export type { ButtonTracking } from "./button.hook";
export type { Button } from "./button-place.vo";
export { CmsConsent } from "./cms-consent.adapter";
export { type AnalyticsUseCases, analyticsUseCases } from "./container";
export { DiscardingAudience } from "./discarding-audience.adapter";
export { type DocumentTracking, useDocumentTracking } from "./document.hook";
export { useNewSimulation, useRecordTheJourney } from "./journey.hook";
export {
  configFromEnv,
  loadMatomo,
  MatomoAudience,
} from "./matomo-audience.adapter";
export {
  type QuestionnaireTracking,
  useQuestionnaireTracking,
} from "./questionnaire.hook";
export { useResultTracking } from "./result.hook";
export { useResultScreen } from "./result-screen.hook";
export type { ResultCodes } from "./revision.entity";
export { ServerJournal } from "./server-journal.adapter";
export {
  AnalyticsProvider,
  JourneyProvider,
} from "./use-cases-in-the-tree.hook";
