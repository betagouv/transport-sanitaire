// La validation d'un événement du journal : une liste fermée de champs, et
// leurs types. Un champ hors de la liste refuse l'événement entier : c'est ce
// qui empêche une réponse ou un texte libre d'entrer dans le journal.
//
// Seul le serveur l'importe : le navigateur ne prend que les types, sans zod.

import { z } from "zod";
import {
  ACTIONS,
  type AnalyticsEvent,
  EVENT_TYPES,
  INTENTS,
  MILESTONES,
  NAVIGATIONS,
  PORTIONS,
  type Portion,
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

// Une version livrée : `10.1.8` pour les règles, `0.7.0` pour l'app.
const release = z.string().regex(/^\d+\.\d+\.\d+$/);

// Une portion qui ne part plus : `TERRESTRE` ne prouvait pas de partie
// terrestre (#443). Un onglet resté sur une version d'avant l'envoie encore :
// l'événement est reçu, sans elle.
const PORTIONS_RETIREES = ["TERRESTRE"] as const;

const estUnePortion = (portion: string): portion is Portion =>
  PORTIONS.some((connue) => connue === portion);

// La clé d'un champ du cerfa, telle que le code l'écrit : jamais un texte saisi.
const fieldId = z.string().regex(/^[a-z][a-z0-9_]{0,95}$/);

const EVENT_SCHEMA: z.ZodType<AnalyticsEvent> = z.strictObject({
  event_id: identifier,
  simulation_id: identifier,
  sequence: z.number().int().min(1).optional(),
  occurred_at: z.iso.datetime({ offset: true }),
  version: release,
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
  page_view_id: identifier.optional(),
  milestones: z.array(z.enum(MILESTONES)).min(1).optional(),
  financeur: identifier.optional(),
  motifs: z.array(identifier).optional(),
  portions: z
    .array(z.enum([...PORTIONS, ...PORTIONS_RETIREES]))
    .transform((portions) => portions.filter(estUnePortion))
    .optional(),
  sheet_id: identifier.optional(),
  action: z.enum(ACTIONS).optional(),
  fields: z
    .array(
      z.strictObject({
        field_id: fieldId,
        font_size_pt: z.number().positive(),
      }),
    )
    .optional(),
  unmeasured_field_ids: z.array(fieldId).optional(),
  navigation: z.enum(NAVIGATIONS).optional(),
  app_version: release,
  commit_sha: z.string().regex(/^([0-9a-f]{7}|inconnu)$/),
});
