// Un événement du journal des parcours, tel que le navigateur l'envoie : le
// socle d'ANA-1015 (REFERENTIEL/03 du paquet de l'éditeur), et nos compléments.
// Le navigateur n'importe que ce fichier : la validation, avec zod, est dans
// `event-schema.ts`. Voir docs/knowledge/adr/analytics.md, ADR-6.

/** La version d'ANA-1015 que suit le contrat. */
export const ANALYTICS_VERSION = "10.1.7";

/**
 * La version de nos compléments, écrite par le serveur à chaque événement. La 2
 * ajoute l'affichage de page, les jalons de phase et l'invalidation d'une
 * validation (ADR-8).
 */
export const SCHEMA_VERSION = 2;

export const EVENT_TYPES = [
  "simulation_started",
  "intent_selected",
  "phase_entered",
  "phase_completed",
  "question_exposed",
  "question_interacted",
  "question_validated",
  "result_displayed",
  "result_invalidated",
  "document_displayed",
  "document_print_requested",
  "document_download_requested",
  "document_download_succeeded",
  "document_generation_failed",
  "feedback_exposed",
  "feedback_clicked",
  "simulation_closed",
  // Nos compléments.
  "question_invalidated",
] as const;

type EventType = (typeof EVENT_TYPES)[number];

export const SCREENS = ["P0", "P1", "P2", "R2", "P3", "R3"] as const;

export type Screen = (typeof SCREENS)[number];

/** Les phases du parcours : leurs pages ont une entrée, une fin et des jalons. */
export const PHASES = ["P1", "P2", "P3"] as const;

export type Phase = (typeof PHASES)[number];

/** Les jalons d'une page dans sa phase : sa première, sa dernière, ou les deux. */
export const MILESTONES = ["first", "last"] as const;

export type Milestone = (typeof MILESTONES)[number];

export const INTENTS = [
  "eligibilite_seule",
  "eligibilite_et_prescription",
] as const;

/** Ce que le prescripteur est venu faire : son premier choix validé en P0. */
export type AnalyticsIntent = (typeof INTENTS)[number];

/** Ce qu'un événement porte : rien d'autre ne passe. */
export type AnalyticsEvent = {
  event_id: string;
  simulation_id: string;
  sequence?: number;
  occurred_at: string;
  version: string;
  type: EventType;
  screen?: Screen;
  revision?: string;
  intent?: AnalyticsIntent;
  establishment_id?: string;
  is_test?: boolean;
  question_id?: string;
  page_id?: string;
  exposure_id?: string;
  can_complete?: boolean;
  issue?: string;
  mode?: string;
  reason_codes?: string[];
  document_id?: string;
  support?: string;
  status?: string;
  field_group?: string;
  font_size_pt?: number;
  // Nos compléments.
  service_id?: string;
  page_view_id?: string;
  milestones?: Milestone[];
};
