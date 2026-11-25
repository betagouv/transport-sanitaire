// Les événements d'une simulation, tels que le journal les reçoit : numérotés
// dans l'ordre, sans trou, datés, et sous l'enveloppe du contrat v10.2.2. Un
// trou dans les numéros dit qu'un événement s'est perdu. Chaque événement dit
// le contrat, sa provenance et son origine : le prescripteur, ou l'app seule.
//
// Fermée, la simulation ne garde plus rien : un geste resté sur un ancien écran
// ne part pas sous elle.

import {
  type ActivityOrigin,
  type ClosureReason,
  CONTRACT_VERSION,
} from "../../../shared/analytics/analytics-event.constants";
import type {
  AnalyticsEvent,
  EventDetails,
  Provenance,
} from "../../../shared/analytics/analytics-event.types";

/** Rien à garder au journal : le parcours d'une seed, ou une simulation fermée. */
export type NothingToRecord = null;

export class EventSequence {
  readonly simulationId = crypto.randomUUID();
  readonly #seeded: boolean;
  readonly #provenance: Provenance;
  #sequence = 0;
  #closed = false;

  constructor(opening: { seeded: boolean; provenance: Provenance }) {
    this.#seeded = opening.seeded;
    this.#provenance = opening.provenance;
  }

  /** L'événement suivant, numéroté et daté. */
  record(details: EventDetails): AnalyticsEvent | NothingToRecord {
    if (this.#seeded || this.#closed) return null;
    this.#sequence += 1;
    return {
      event_id: `${this.simulationId}:${this.#sequence}`,
      simulation_id: this.simulationId,
      sequence: this.#sequence,
      occurred_at: new Date().toISOString(),
      version: CONTRACT_VERSION,
      ...this.#provenance,
      activity_origin: originOf(details),
      is_test: false,
      ...details,
    };
  }

  recordAll(details: readonly EventDetails[]): AnalyticsEvent[] {
    return details.flatMap((each) => this.record(each) ?? []);
  }

  /** La fermeture, sous le numéro suivant : la dernière chose qui part. */
  close(reason: ClosureReason): AnalyticsEvent | NothingToRecord {
    const closure = this.record({
      type: "simulation_closed",
      closure_reason: reason,
    });
    this.#closed = true;
    return closure;
  }
}

// ---- implémentation ----

// Ce que l'app fait seule, sans geste du prescripteur : une exposition est
// passive (ANA22-02), une mesure, un échec et un PDF remis sont techniques.
const BY_THE_APP: readonly AnalyticsEvent["type"][] = [
  "button_exposed",
  "feedback_exposed",
  "document_typography_measured",
  "document_generation_failed",
  "document_download_succeeded",
];

function originOf({ type }: EventDetails): ActivityOrigin {
  return BY_THE_APP.includes(type) ? "background" : "user";
}
