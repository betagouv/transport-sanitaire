// Ce que la mesure d'audience promet au reste de l'écran : Matomo et ses
// évènements, et le journal des parcours.

export { EventName, trackEvent } from "./events";
export { initJournal, startASimulation } from "./journey";
export { configFromEnv, initAnalytics, loadMatomo } from "./matomo";
export { sendToTheJournal } from "./send-to-the-journal";
