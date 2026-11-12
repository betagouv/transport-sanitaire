// La collecte d'un événement : le domaine du journal. Il date la réception,
// garde un événement nouveau, ignore un renvoi identique, et met à part un
// autre événement qui reprend le même `event_id` (ANA-1015 : deux contenus
// sous la même identité ne se fusionnent pas). Il ne connaît le stockage que
// par son port.

import { isDeepStrictEqual } from "node:util";
import {
  type AnalyticsEvent,
  SCHEMA_VERSION,
} from "../../shared/analytics/analytics-event.ts";
import type { Journal } from "./journal.ts";

export type Collected = "added" | "duplicate" | "collision";

export async function collectAnEvent(
  journal: Journal,
  event: AnalyticsEvent,
  environment: string,
): Promise<Collected> {
  const recorded = {
    event,
    receivedAt: new Date().toISOString(),
    environment,
    schemaVersion: SCHEMA_VERSION,
  };
  const known = await journal.find(event.event_id);
  if (!known) {
    await journal.append(recorded);
    return "added";
  }
  if (isDeepStrictEqual(known.event, event)) return "duplicate";
  await journal.setAside(recorded);
  return "collision";
}
