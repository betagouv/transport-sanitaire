// Le port de la mesure d'audience : ce que le parcours attend pour compter ses
// étapes. Matomo en est l'adaptateur (`matomo-audience.adapter.ts`).
// Voir docs/knowledge/adr/analytics.md, ADR-1.

import type { AudienceEvent } from "./audience-event.entity";

export interface Audience {
  track(event: AudienceEvent): void;
}
