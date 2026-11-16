// Le port de la mesure d'audience : ce que le parcours attend pour compter ses
// étapes. Matomo en est l'adaptateur (`matomo-audience.adapter.ts`).
// Voir ADR-0001.

import type { AudienceEvent } from "./audience-event.entity";

export interface Audience {
  track(event: AudienceEvent): void;
}
