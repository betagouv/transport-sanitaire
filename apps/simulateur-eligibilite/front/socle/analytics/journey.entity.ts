// Le parcours d'un prescripteur, tel que le journal le reçoit : une
// simulation, et ses événements numérotés dans l'ordre. Un trou dans les
// numéros dit qu'un événement s'est perdu.

import {
  ANALYTICS_VERSION,
  type AnalyticsEvent,
  type AnalyticsIntent,
} from "../../../shared/analytics/analytics-event";

/** Ce qu'un événement dit de lui-même : le parcours fait le reste. */
export type EventDetails = Omit<
  AnalyticsEvent,
  "event_id" | "simulation_id" | "sequence" | "occurred_at" | "version"
>;

export class Journey {
  readonly simulationId: string;
  #sequence = 0;
  #intentSelected = false;

  constructor(simulationId: string = crypto.randomUUID()) {
    this.simulationId = simulationId;
  }

  /** L'événement suivant du parcours, numéroté et daté. */
  next(details: EventDetails): AnalyticsEvent {
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

  /**
   * L'intention du parcours : celle du premier choix validé. Un retour sur P0
   * peut changer le choix à l'écran, pas l'intention. `null` : elle est déjà
   * connue, rien ne part.
   */
  selectIntent(intent: AnalyticsIntent): AnalyticsEvent | null {
    if (this.#intentSelected) return null;
    this.#intentSelected = true;
    return this.next({ type: "intent_selected", screen: "P0", intent });
  }
}
