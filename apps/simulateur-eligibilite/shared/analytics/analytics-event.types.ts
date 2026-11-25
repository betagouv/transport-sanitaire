// Ce qu'un événement du journal des parcours porte, et ses morceaux. Les listes
// fermées dont il dérive sont dans `analytics-event.constants.ts`.

import type {
  ActivityOrigin,
  AnalyticsIntent,
  Boundary,
  ButtonId,
  ClosureReason,
  CONTRACT_VERSION,
  EventType,
  Issue,
  Mode,
  Screen,
  Support,
  TransportComposition,
} from "./analytics-event.constants.ts";

/**
 * La taille réellement imprimée d'un champ rempli du document R3, en points.
 * `field_id` est son identifiant fermé, `<support>.<champ>`
 * (`typographic-fields.constants.ts`), jamais son texte.
 */
type FieldMeasurement = { field_id: string; font_size_pt: number };

/** Ce qu'un événement porte : rien d'autre ne passe. */
export type AnalyticsEvent = {
  event_id: string;
  simulation_id: string;
  /** Le rang de l'événement dans sa simulation, strictement croissant. */
  sequence: number;
  occurred_at: string;
  /** La version du contrat, `CONTRACT_VERSION`. */
  version: typeof CONTRACT_VERSION;
  /** La version des règles du modèle, celle de `rules/VERSION`. */
  model_version: string;
  /** La version de l'app, celle de `package.json`. */
  app_version: string;
  /** Le prescripteur, ou l'app seule : seul le premier fait vivre la simulation. */
  activity_origin: ActivityOrigin;
  type: EventType;
  screen?: Screen;
  revision?: string;
  /** La révision du document R3, à côté de celle du R2. */
  document_revision?: string;
  intent?: AnalyticsIntent;
  establishment_id?: string;
  is_test?: boolean;
  question_id?: string;
  page_id?: string;
  exposure_id?: string;
  can_complete?: boolean;
  issue?: Issue;
  mode?: Mode;
  transport_composition?: TransportComposition;
  reason_codes?: string[];
  document_id?: string;
  support?: Support;
  /** Les champs remplis du document R3, sous leur identifiant fermé. */
  expected_field_ids?: string[];
  /** La taille de chaque champ attendu qui a pu se mesurer. */
  field_measurements?: FieldMeasurement[];
  field_group?: string;
  font_size_pt?: number;
  button_id?: ButtonId;
  /** Ce que le bouton montre : la version de la fiche, ou celle du document. */
  artifact_id?: string;
  boundary?: Boundary;
  closure_reason?: ClosureReason;
  service_id?: string;
};

/**
 * Le rattachement du parcours, sur chacun de ses événements : les ids
 * du référentiel, quand il en a.
 */
export type RattachementDuParcours = Pick<
  AnalyticsEvent,
  "establishment_id" | "service_id"
>;

/**
 * D'où vient un parcours, sur chacun de ses événements : la version de son
 * modèle et celle de l'app, et son rattachement.
 */
export type Provenance = Pick<AnalyticsEvent, "model_version" | "app_version"> &
  RattachementDuParcours;

/**
 * Ce qu'un événement dit de lui-même : le parcours le numérote, le date, dit
 * le contrat, sa provenance et son origine.
 */
export type EventDetails = Omit<
  AnalyticsEvent,
  | "event_id"
  | "simulation_id"
  | "sequence"
  | "occurred_at"
  | "version"
  | "activity_origin"
  | keyof Provenance
>;
