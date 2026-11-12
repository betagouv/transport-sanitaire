// Le parcours d'un prescripteur, tel que le journal le reçoit : une
// simulation, et ses événements numérotés dans l'ordre. Un trou dans les
// numéros dit qu'un événement s'est perdu.

import {
  ANALYTICS_VERSION,
  type AnalyticsEvent,
} from "../../../shared/analytics/analytics-event";

/** Ce qu'un événement dit de lui-même : le parcours fait le reste. */
export type EventDetails = Omit<
  AnalyticsEvent,
  "event_id" | "simulation_id" | "sequence" | "occurred_at" | "version"
>;

export class Journey {
  readonly simulationId: string;
  #sequence = 0;

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
}
