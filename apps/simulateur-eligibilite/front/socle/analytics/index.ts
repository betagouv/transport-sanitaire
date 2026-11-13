// Ce que la mesure d'audience et le journal des parcours promettent au reste de
// l'écran : leurs use cases et adaptateurs, que le conteneur assemble, et les
// hooks qui traduisent les événements de l'écran en appels de use case.

export { useAldResultReached } from "./ald-pathway.hook";
export { type AldVerdict, EventName } from "./audience-event.entity";
export { CmsConsent } from "./cms-consent.adapter";
export { CompleteAQuestionnaire } from "./complete-a-questionnaire.usecase";
export { DiscardingAudience } from "./discarding-audience.adapter";
export { useRecordTheJourney } from "./journey.hook";
export { LeaveAQuestionnaire } from "./leave-a-questionnaire.usecase";
export {
  configFromEnv,
  loadMatomo,
  MatomoAudience,
} from "./matomo-audience.adapter";
export { PassAStep } from "./pass-a-step.usecase";
export {
  type QuestionnaireTracking,
  useQuestionnaireTracking,
} from "./questionnaire.hook";
export { ReachAnAldResult } from "./reach-an-ald-result.usecase";
export { SelectAnIntent } from "./select-an-intent.usecase";
export { ServerJournal } from "./server-journal.adapter";
export { StartAQuestionnaire } from "./start-a-questionnaire.usecase";
export { StartASimulation } from "./start-a-simulation.usecase";
export {
  AudienceProvider,
  type AudienceUseCases,
  JournalProvider,
  type JournalUseCases,
} from "./use-cases-in-the-tree";
