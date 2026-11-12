// Ce que le rattachement promet au reste de l'écran : l'écran-porte, la
// structure qu'il remonte, le rattachement gardé en session, et ce qui parle
// au serveur, que le conteneur instancie.

export { declarerAuServeur } from "./declarer-la-saisie";
export { RattachementScreen } from "./RattachementScreen";
export {
  rangerRattachement,
  rattachementEnSession,
} from "./rattachement-en-session";
export { referentielDuServeur } from "./referentiel";
export type { Structure } from "./structures";
