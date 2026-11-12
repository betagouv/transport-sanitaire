// Le port du journal des parcours, côté écran : ce que le parcours attend pour
// garder ses événements. Le backend en est l'adaptateur
// (`server-journal.adapter.ts`). Voir docs/knowledge/adr/analytics.md, ADR-6.

import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event";

export interface Journal {
  record(event: AnalyticsEvent): Promise<void>;
}
