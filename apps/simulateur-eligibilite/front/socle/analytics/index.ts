// Ce que la mesure d'audience promet au reste de l'écran : Matomo et ses
// évènements, et le journal des parcours.

export { EventName, trackEvent } from "./events";
export {
  JournalProvider,
  type JournalUseCases,
  useJournal,
} from "./journal.context";
export type { Journey } from "./journey.entity";
export { configFromEnv, initAnalytics, loadMatomo } from "./matomo";
export { SelectAnIntent } from "./select-an-intent.usecase";
export { ServerJournal } from "./server-journal.adapter";
export { StartASimulation } from "./start-a-simulation.usecase";
