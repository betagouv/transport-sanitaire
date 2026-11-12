// La validation d'un événement du journal : une liste fermée de champs, et
// leurs types. Un champ hors de la liste refuse l'événement entier : c'est ce
// qui empêche une réponse ou un texte libre d'entrer dans le journal.
//
// Seul le serveur l'importe : le navigateur ne prend que les types, sans zod.

import { z } from "zod";
import {
  type AnalyticsEvent,
  EVENT_TYPES,
  INTENTS,
  SCREENS,
} from "./analytics-event.ts";

/** Ce qui est reçu sort du contrat : un champ en trop, ou mal formé. */
type OutOfContract = undefined;

export function parseAnAnalyticsEvent(
  received: unknown,
): AnalyticsEvent | OutOfContract {
  const parsed = EVENT_SCHEMA.safeParse(received);
  return parsed.success ? parsed.data : undefined;
}

// ---- implémentation ----

const identifier = z.string().trim().min(1);

const EVENT_SCHEMA: z.ZodType<AnalyticsEvent> = z.strictObject({
  event_id: identifier,
  simulation_id: identifier,
  sequence: z.number().int().min(1).optional(),
  occurred_at: z.iso.datetime({ offset: true }),
  version: identifier,
  type: z.enum(EVENT_TYPES),
  screen: z.enum(SCREENS).optional(),
  revision: identifier.optional(),
  intent: z.enum(INTENTS).optional(),
  establishment_id: identifier.optional(),
  is_test: z.boolean().optional(),
  question_id: identifier.optional(),
  page_id: identifier.optional(),
  exposure_id: identifier.optional(),
  can_complete: z.boolean().optional(),
  issue: identifier.optional(),
  mode: identifier.optional(),
  reason_codes: z.array(z.string().regex(/^[A-Z][A-Z0-9_]{0,95}$/)).optional(),
  document_id: identifier.optional(),
  support: identifier.optional(),
  status: identifier.optional(),
  field_group: identifier.optional(),
  font_size_pt: z.number().positive().optional(),
  service_id: identifier.optional(),
});
