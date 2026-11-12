// Ce que la mesure d'audience promet au reste de l'écran : Matomo et ses
// évènements, et le journal des parcours.

export { EventName, trackEvent } from "./events";
export { initJournal, startASimulation } from "./journey-in-session";
export { configFromEnv, initAnalytics, loadMatomo } from "./matomo";
export { ServerJournal } from "./server-journal.adapter";
export { StartASimulation } from "./start-a-simulation.usecase";
