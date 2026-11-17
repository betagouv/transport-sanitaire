// La validation d'un événement du journal : une liste fermée de champs, et
// leurs types. Un champ hors de la liste refuse l'événement entier : c'est ce
// qui empêche une réponse ou un texte libre d'entrer dans le journal.
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

// Une version livrée : `10.2.1` pour le modèle, `0.7.0` pour l'app.
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
  .refine(measuresItsOwnFields)
  .refine(placesItsButton)
  .refine(namesItsDocument);

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

// Un bouton exposé ou cliqué dit lequel, son exposition, sa révision et l'objet
// qu'il montre, sur son écran : la fiche sur R2, le document sur R3, qui est
// alors son objet. Son clic vient du prescripteur (ANA22-02).
function placesItsButton(event: AnalyticsEvent): boolean {
  const { type, button_id, screen, document_id } = event;
  if (type !== "button_exposed" && type !== "button_clicked") return true;
  const { exposure_id, revision, artifact_id } = event;
  if (!button_id || !exposure_id || !revision || !artifact_id) return false;
  if (type === "button_clicked" && event.activity_origin !== "user")
    return false;
  if (button_id.startsWith("patient_sheet_")) return screen === "R2";
  return (
    screen === "R3" &&
    event.document_revision !== undefined &&
    artifact_id === document_id
  );
}

// L'impression et le téléchargement du document lancés, et le PDF remis.
// `document_displayed` y viendra avec sa révision du document (#497).
const OF_A_DOCUMENT: readonly AnalyticsEvent["type"][] = [
  "document_print_requested",
  "document_download_requested",
  "document_download_succeeded",
];

// L'impression ou le téléchargement lancés disent leur document et sa révision.
function namesItsDocument(event: AnalyticsEvent): boolean {
  if (!OF_A_DOCUMENT.includes(event.type)) return true;
  return (
    event.revision !== undefined &&
    event.document_revision !== undefined &&
    event.document_id !== undefined
  );
}
