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
  MODES,
  NAVIGATIONS,
  SCREENS,
  TRANSPORT_COMPOSITIONS,
} from "./analytics-event.ts";
import { TYPOGRAPHIC_FIELDS } from "./typographic-fields.ts";

/** Ce qui est reçu sort du contrat : un champ en trop, ou mal formé. */
type OutOfContract = undefined;

export function parseAnAnalyticsEvent(
  received: unknown,
): AnalyticsEvent | OutOfContract {
  const parsed = EVENT_SCHEMA.safeParse(sansLesPortions(received));
  return parsed.success ? parsed.data : undefined;
}

// ---- implémentation ----

const identifier = z.string().trim().min(1);

// Le nom d'un établissement ou d'un service : celui d'une liste du référentiel,
// ou un nom saisi, que l'écran borne à `LONGUEUR_MAX_D_UN_NOM`. La borne d'ici
// est plus large : un nom long du référentiel ne fait pas perdre l'événement.
const name = z.string().trim().min(1).max(300);

// Une version livrée : `10.1.8` pour les règles, `0.7.0` pour l'app.
const release = z.string().regex(/^\d+\.\d+\.\d+$/);

// Les portions ne partent plus : la composition du transport les remplace
// (#509). Un onglet resté sur une version d'avant les envoie encore :
// l'événement est reçu, sans elles.
function sansLesPortions(received: unknown): unknown {
  if (typeof received !== "object" || received === null) return received;
  const { portions: _, ...event } = received as Record<string, unknown>;
  return event;
}

// Un champ de la liste fermée : jamais un texte saisi, ni une clé de notre DTO.
const fieldId = z.enum(Object.values(TYPOGRAPHIC_FIELDS).flat());

const EVENT_SCHEMA: z.ZodType<AnalyticsEvent> = z
  .strictObject({
    event_id: identifier,
    simulation_id: identifier,
    sequence: z.number().int().min(1).optional(),
    occurred_at: z.iso.datetime({ offset: true }),
    version: release,
    type: z.enum(EVENT_TYPES),
    screen: z.enum(SCREENS).optional(),
    revision: identifier.optional(),
    document_revision: identifier.optional(),
    intent: z.enum(INTENTS).optional(),
    establishment_id: identifier.optional(),
    is_test: z.boolean().optional(),
    question_id: identifier.optional(),
    page_id: identifier.optional(),
    exposure_id: identifier.optional(),
    can_complete: z.boolean().optional(),
    issue: identifier.optional(),
    mode: z.enum(MODES).optional(),
    transport_composition: z.enum(TRANSPORT_COMPOSITIONS).optional(),
    reason_codes: z
      .array(z.string().regex(/^[A-Z][A-Z0-9_]{0,95}$/))
      .optional(),
    document_id: identifier.optional(),
    support: identifier.optional(),
    expected_field_ids: z.array(fieldId).optional(),
    field_measurements: z
      .array(
        z.strictObject({
          field_id: fieldId,
          font_size_pt: z.number().positive(),
        }),
      )
      .optional(),
    field_group: identifier.optional(),
    font_size_pt: z.number().positive().optional(),
    service_id: identifier.optional(),
    establishment_name: name.optional(),
    service_name: name.optional(),
    page_view_id: identifier.optional(),
    milestones: z.array(z.enum(MILESTONES)).min(1).optional(),
    financeur: identifier.optional(),
    motifs: z.array(identifier).optional(),
    sheet_id: identifier.optional(),
    action: z.enum(ACTIONS).optional(),
    navigation: z.enum(NAVIGATIONS).optional(),
    app_version: release,
    commit_sha: z.string().regex(/^([0-9a-f]{7}|inconnu)$/),
  })
  .refine(measuresItsOwnFields);

// Le collecteur refuse un champ d'un autre support, un champ attendu ou mesuré
// deux fois, et la mesure d'un champ qui n'est pas attendu (ANA22-03).
function measuresItsOwnFields({
  support,
  expected_field_ids: expected = [],
  field_measurements = [],
}: AnalyticsEvent): boolean {
  const measured = field_measurements.map(({ field_id }) => field_id);
  const ofItsSupport = (id: string) => id.startsWith(`${support}.`);
  return (
    [...expected, ...measured].every(ofItsSupport) &&
    new Set(expected).size === expected.length &&
    new Set(measured).size === measured.length &&
    measured.every((id) => expected.includes(id))
  );
}
