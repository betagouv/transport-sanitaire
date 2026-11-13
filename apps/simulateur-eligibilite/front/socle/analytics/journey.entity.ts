// Le parcours d'un prescripteur, tel que le journal le reçoit : une
// simulation, et ses événements numérotés dans l'ordre. Un trou dans les
// numéros dit qu'un événement s'est perdu.

import {
  ANALYTICS_VERSION,
  type AnalyticsEvent,
  type AnalyticsIntent,
} from "../../../shared/analytics/analytics-event";

// Ce qu'un événement dit de lui-même : le parcours fait le reste.
type EventDetails = Omit<
  AnalyticsEvent,
  "event_id" | "simulation_id" | "sequence" | "occurred_at" | "version"
>;

/** Rien à garder au journal : le parcours d'une seed, ou une intention déjà connue. */
export type NothingToRecord = null;

/** Où le parcours commence : l'établissement et le service du rattachement. */
export type Entrance = Pick<AnalyticsEvent, "establishment_id" | "service_id">;

export class Journey {
  readonly simulationId = crypto.randomUUID();
  readonly #seeded: boolean;
  #sequence = 0;
  #intentSelected = false;

  /**
   * `seeded` : la simulation s'ouvre sur une seed, au milieu du parcours. Elle
   * n'est pas un parcours de prescripteur : rien n'en part.
   */
  constructor({ seeded }: { seeded: boolean }) {
    this.#seeded = seeded;
  }

  /** Le début du parcours, sur P0. */
  start(entrance: Entrance): AnalyticsEvent | NothingToRecord {
    return this.#record({
      type: "simulation_started",
      screen: "P0",
      ...entrance,
    });
  }

  /**
   * L'intention du parcours : celle du premier choix validé. Un retour sur P0
   * peut changer le choix à l'écran, pas l'intention.
   */
  selectIntent(intent: AnalyticsIntent): AnalyticsEvent | NothingToRecord {
    if (this.#intentSelected) return null;
    this.#intentSelected = true;
    return this.#record({ type: "intent_selected", screen: "P0", intent });
  }

  // L'événement suivant du parcours, numéroté et daté.
  #record(details: EventDetails): AnalyticsEvent | NothingToRecord {
    if (this.#seeded) return null;
    this.#sequence += 1;
    return {
      event_id: `${this.simulationId}:${this.#sequence}`,
      simulation_id: this.simulationId,
      sequence: this.#sequence,
      occurred_at: new Date().toISOString(),
      version: ANALYTICS_VERSION,
      is_test: false,
      ...details,
    };
  }
}
