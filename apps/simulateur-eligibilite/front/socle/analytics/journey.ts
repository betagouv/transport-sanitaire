// Le parcours du prescripteur, tel que le journal le reçoit (ADR-6
// d'analytics.md) : une simulation, et ses événements numérotés dans l'ordre.
//
// Rien ne part tant que `main.tsx` n'a pas donné l'envoi : les tests et les
// écrans qui ne le donnent pas n'écrivent dans aucun journal.

import {
  ANALYTICS_VERSION,
  type AnalyticsEvent,
} from "../../../shared/analytics/analytics-event";
import { rattachementEnSession } from "../rattachement";
import type { SendAnEvent } from "./send-to-the-journal";

export function initJournal(sendAnEvent: SendAnEvent): void {
  send = sendAnEvent;
}

/** Ouvre une simulation, et le signale au journal. */
export function startASimulation(): void {
  simulation = { id: crypto.randomUUID(), sequence: 0 };
  const rattachement = rattachementEnSession();
  emit({
    type: "simulation_started",
    screen: "P0",
    establishment_id: rattachement?.etabId || undefined,
    service_id: rattachement?.serviceId,
  });
}

// ---- implémentation ----

let send: SendAnEvent = sendNothing;
let simulation = { id: "", sequence: 0 };

type Details = Omit<
  AnalyticsEvent,
  "event_id" | "simulation_id" | "sequence" | "occurred_at" | "version"
>;

function emit(details: Details) {
  simulation.sequence += 1;
  const event: AnalyticsEvent = {
    event_id: `${simulation.id}:${simulation.sequence}`,
    simulation_id: simulation.id,
    sequence: simulation.sequence,
    occurred_at: new Date().toISOString(),
    version: ANALYTICS_VERSION,
    is_test: false,
    ...details,
  };
  void send(event);
}

async function sendNothing() {}
