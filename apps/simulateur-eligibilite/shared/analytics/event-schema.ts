// La validation d'un événement du journal : une liste fermée de champs, leurs
// types, et les règles croisées du contrat v10.2.2. Un champ hors de la liste
// refuse l'événement entier : c'est ce qui empêche une réponse ou un texte libre
// d'entrer dans le journal. Un onglet ouvert sur un contrat d'avant est refusé
// de même : il n'y a qu'une forme reçue, celle du contrat courant.
//
// Seul le serveur l'importe : le navigateur ne prend que les types, sans zod.

import { z } from "zod";
import {
  ACTIVITY_ORIGINS,
  type AnalyticsEvent,
  BOUNDARIES,
  BUTTON_IDS,
  CLOSURE_REASONS,
  CONTRACT_VERSION,
  EVENT_TYPES,
  INTENTS,
  ISSUES,
  MODES,
  SCREENS,
  SUPPORTS,
  TRANSPORT_COMPOSITIONS,
} from "./analytics-event.ts";
import { CONTRACT_RULES } from "./contract-rule.vo.ts";
import { TYPOGRAPHIC_FIELDS } from "./typographic-fields.ts";

/** Ce qui est reçu sort du contrat : un champ en trop, ou mal formé. */
type OutOfContract = undefined;

export function parseAnAnalyticsEvent(
  received: unknown,
): AnalyticsEvent | OutOfContract {
  const parsed = EVENT_SCHEMA.safeParse(received);
  return parsed.success ? parsed.data : undefined;
}

/**
 * Pourquoi un envoi est refusé, à écrire dans les traces du serveur : un onglet
 * d'un autre contrat, ou les champs et les règles en cause. Rien de ce qu'il
 * porte n'en sort, sauf une version bien formée.
 */
export function explainARefusal(received: unknown): string {
  const version = (received as { version?: unknown } | null)?.version;
  if (version !== CONTRACT_VERSION)
    return `onglet d'un autre contrat (${releaseOrUnknown(version)})`;
  const parsed = EVENT_SCHEMA.safeParse(received);
  if (parsed.success) return "aucune raison";
  return `hors contrat (${parsed.error.issues.map(causeOf).join(", ")})`;
}

// ---- implémentation ----

const identifier = z.string().trim().min(1);

// Une version livrée : `10.2.1` pour le modèle, `0.7.0` pour l'app.
const release = z.string().regex(/^\d+\.\d+\.\d+$/);

function releaseOrUnknown(version: unknown): string {
  return release.safeParse(version).success ? String(version) : "inconnu";
}

// Une cause sans valeur : la règle enfreinte, le champ mal formé, ou le nom
// d'un champ inconnu, s'il a la forme d'un nom de champ.
function causeOf(issue: z.core.$ZodIssue): string {
  if (issue.code === "custom") return issue.message;
  if (issue.code === "unrecognized_keys")
    return issue.keys.map(nameOrUnknown).join(", ");
  return issue.path.map(String).map(nameOrUnknown).join(".");
}

function nameOrUnknown(key: string): string {
  return /^[a-z_]{1,40}$/.test(key) ? key : "champ inconnu";
}

// Un champ de la liste fermée : jamais un texte saisi, ni une clé de notre DTO.
const fieldId = z.enum(Object.values(TYPOGRAPHIC_FIELDS).flat());

const EVENT_SCHEMA: z.ZodType<AnalyticsEvent> = z
  .strictObject({
    event_id: identifier,
    simulation_id: identifier,
    sequence: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
    occurred_at: z.iso.datetime({ offset: true }),
    version: z.literal(CONTRACT_VERSION),
    model_version: release,
    app_version: release,
    activity_origin: z.enum(ACTIVITY_ORIGINS),
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
    issue: z.enum(ISSUES).optional(),
    mode: z.enum(MODES).optional(),
    transport_composition: z.enum(TRANSPORT_COMPOSITIONS).optional(),
    reason_codes: z
      .array(z.string().regex(/^[A-Z][A-Z0-9_]{0,95}$/))
      .optional(),
    document_id: identifier.optional(),
    support: z.enum(SUPPORTS).optional(),
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
    button_id: z.enum(BUTTON_IDS).optional(),
    artifact_id: identifier.optional(),
    boundary: z.enum(BOUNDARIES).optional(),
    closure_reason: z.enum(CLOSURE_REASONS).optional(),
    service_id: identifier.optional(),
  })
  .superRefine((event, context) => {
    for (const rule of CONTRACT_RULES)
      if (rule.brokenBy(event))
        context.addIssue({ code: "custom", message: `règle ${rule.number}` });
  })
  .refine(measuresEachFieldOnce, { message: "mesure en double" })
  .refine(showsItsDocument, { message: "bouton sur un autre document" });

// Une mesure n'attend ni ne mesure un champ deux fois, et ne mesure que ce
// qu'elle attend (ANA22-03).
function measuresEachFieldOnce({
  expected_field_ids: expected = [],
  field_measurements = [],
}: AnalyticsEvent): boolean {
  const measured = field_measurements.map(({ field_id }) => field_id);
  return (
    new Set(expected).size === expected.length &&
    new Set(measured).size === measured.length &&
    measured.every((id) => expected.includes(id))
  );
}

// Un bouton du document a ce document pour objet (ANA22-02).
function showsItsDocument(event: AnalyticsEvent): boolean {
  const { button_id, artifact_id, document_id } = event;
  if (button_id !== "document_print" && button_id !== "document_download")
    return true;
  return artifact_id === document_id;
}
