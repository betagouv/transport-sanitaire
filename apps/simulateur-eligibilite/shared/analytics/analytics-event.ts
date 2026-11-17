// Un événement du journal des parcours, tel que le navigateur l'envoie : le
// socle d'ANA-1015 (REFERENTIEL/03 du paquet de l'éditeur), et nos compléments.
// Le navigateur n'importe que ce fichier : la validation, avec zod, est dans
// `event-schema.ts`. Voir ADR-0042.

/**
 * La version de nos compléments, écrite par le serveur à chaque événement. La 2
 * ajoute l'affichage de page, les jalons de phase et l'invalidation d'une
 * validation (ADR-0044), puis le financeur, les motifs et les portions du premier
 * résultat (ADR-0045), puis les boutons exposés, la fiche patient et ses clics
 * (ADR-0047), puis la taille des champs du document R3 (ADR-0048), puis le
 * chargement de la page (ADR-0049), puis la version de l'app et le commit
 * déployé (ADR-0050). La 3 ajoute le nom de l'établissement et celui du
 * service, et pose le rattachement sur chaque événement (ADR-0053), puis
 * prend les boutons exposés et cliqués du contrat v10.2.2 (ADR-0047, #507).
 */
export const SCHEMA_VERSION = 3;

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
  "button_exposed",
  "button_clicked",
  "simulation_closed",
  // Nos compléments.
  "document_typography_measured",
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

/** Les cinq modes terrestres : `mode` ne dit jamais la ligne régulière. */
export const MODES = [
  "TAP",
  "TPMR",
  "AMBULANCE",
  "VEHICULE_PERSONNEL",
  "TRANSPORT_COMMUN",
] as const;

export type Mode = (typeof MODES)[number];

/**
 * La composition du transport d'un résultat ou de son document (ANA22-04) :
 * terrestre seul, ligne régulière seule, les deux, inconnue faute de preuve, ou
 * sans objet. Les deux premières et la dernière disent si `mode` part.
 */
export const TRANSPORT_COMPOSITIONS = [
  "terrestrial_only",
  "regular_line_only",
  "mixed",
  "unknown",
  "not_applicable",
] as const;

export type TransportComposition = (typeof TRANSPORT_COMPOSITIONS)[number];

/**
 * Les boutons de la fiche patient (R2) et du document (R3), exposés et cliqués
 * (ADR-0047, ANA22-02). L'avis a ses propres types.
 */
export const BUTTON_IDS = [
  "patient_sheet_print",
  "patient_sheet_download",
  "document_print",
  "document_download",
] as const;

export type ButtonId = (typeof BUTTON_IDS)[number];

/** D'où vient une activité : du prescripteur, de l'app seule, ou d'un rejeu. */
export const ACTIVITY_ORIGINS = ["user", "background", "replay"] as const;

type ActivityOrigin = (typeof ACTIVITY_ORIGINS)[number];

/**
 * La taille réellement imprimée d'un champ rempli du document R3, en points
 * (ADR-0048). `field_id` est son identifiant fermé, `<support>.<champ>`
 * (`typographic-fields.ts`), jamais son texte.
 */
type FieldMeasurement = { field_id: string; font_size_pt: number };

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
  /** La version des règles du modèle, celle de `rules/VERSION` (ADR-0050). */
  version: string;
  type: EventType;
  screen?: Screen;
  revision?: string;
  /** La révision du document R3, à côté de celle du R2 (ADR-0048). */
  document_revision?: string;
  intent?: AnalyticsIntent;
  establishment_id?: string;
  is_test?: boolean;
  question_id?: string;
  page_id?: string;
  exposure_id?: string;
  can_complete?: boolean;
  issue?: string;
  mode?: Mode;
  transport_composition?: TransportComposition;
  reason_codes?: string[];
  document_id?: string;
  support?: string;
  /** Les champs remplis du document R3, sous leur identifiant fermé (ADR-0048). */
  expected_field_ids?: string[];
  /** La taille de chaque champ attendu qui a pu se mesurer (ADR-0048). */
  field_measurements?: FieldMeasurement[];
  field_group?: string;
  font_size_pt?: number;
  button_id?: ButtonId;
  /** Ce que le bouton montre : la version de la fiche, ou celle du document. */
  artifact_id?: string;
  activity_origin?: ActivityOrigin;
  // Nos compléments.
  service_id?: string;
  milestones?: Milestone[];
  /** La version de l'app, celle de `package.json` (ADR-0050). */
  app_version: string;
  /** Le commit déployé, sur 7 caractères, ou `inconnu` (ADR-0050). */
  commit_sha: string;
};

/**
 * Le rattachement du parcours, sur chacun de ses événements (ADR-0053) : les ids
 * du référentiel, quand il en a.
 */
export type RattachementDuParcours = Pick<
  AnalyticsEvent,
  "establishment_id" | "service_id"
>;

/**
 * D'où vient un parcours, sur chacun de ses événements : l'app qui le produit,
 * ses règles, sa version, son commit (ADR-0050), et son rattachement (ADR-0053).
 */
export type Provenance = Pick<
  AnalyticsEvent,
  "version" | "app_version" | "commit_sha"
> &
  RattachementDuParcours;

/** Ce qu'un événement dit de lui-même : le parcours le numérote, le date, et dit sa provenance. */
export type EventDetails = Omit<
  AnalyticsEvent,
  "event_id" | "simulation_id" | "sequence" | "occurred_at" | keyof Provenance
>;
