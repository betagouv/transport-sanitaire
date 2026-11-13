// Ce que la mesure d'audience et le journal des parcours promettent au reste de
// l'écran : leurs use cases et adaptateurs, que le conteneur assemble, et les
// contextes où l'arbre React les lit.

export {
  AudienceProvider,
  type AudienceUseCases,
  type Track,
  useAudience,
} from "./audience.context";
export { EventName } from "./audience-event.entity";
export { CmsConsent } from "./cms-consent.adapter";
export { DiscardingAudience } from "./discarding-audience.adapter";
export {
  JournalProvider,
  type JournalUseCases,
  useRecordTheJourney,
} from "./journal.context";
export {
  configFromEnv,
  loadMatomo,
  MatomoAudience,
} from "./matomo-audience.adapter";
export { SelectAnIntent } from "./select-an-intent.usecase";
export { ServerJournal } from "./server-journal.adapter";
export { StartASimulation } from "./start-a-simulation.usecase";
export { TrackAnEvent } from "./track-an-event.usecase";
