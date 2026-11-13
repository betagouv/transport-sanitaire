// Des événements du journal, tels que le navigateur les envoie.

import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event.ts";

export const simulationStarted: AnalyticsEvent = {
  event_id: "s-1:1",
  simulation_id: "s-1",
  sequence: 1,
  occurred_at: "2026-11-12T10:00:00.000+01:00",
  version: "10.1.8",
  app_version: "0.8.0",
  commit_sha: "f30aafe",
  type: "simulation_started",
  screen: "P0",
  establishment_id: "e_chu_grenoble",
  service_id: "s_grenoble_cardio",
  is_test: false,
};
