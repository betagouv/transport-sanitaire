// Un événement du journal des parcours, tel que le navigateur l'envoie : le
// socle d'ANA-1015 (REFERENTIEL/03 du paquet de l'éditeur), et nos compléments.
// Le navigateur n'importe que ce fichier : la validation, avec zod, est dans
// `event-schema.ts`. Voir docs/knowledge/adr/analytics.md, ADR-6.

/**
 * La version de nos compléments, écrite par le serveur à chaque événement. La 2
 * ajoute l'affichage de page, les jalons de phase et l'invalidation d'une
 * validation (ADR-8), puis le financeur, les motifs et les portions du premier
 * résultat (ADR-9), puis les boutons exposés, la fiche patient et ses clics
 * (ADR-11), puis la taille des champs du document R3 (ADR-12), puis le
 * chargement de la page (ADR-13), puis la version de l'app et le commit
 * déployé (ADR-14).
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
  "action_exposed",
  "sheet_print_requested",
  "sheet_download_requested",
  "sheet_download_succeeded",
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

/**
 * Les portions du trajet que le premier résultat restitue à part (ADR-9) : la
 * ligne régulière, avion ou bateau. Aucune réponse ne prouve une partie
 * terrestre : sa présence reste inconnue, et ne part pas (#443).
 */
export const PORTIONS = ["LIGNE_REGULIERE"] as const;

export type Portion = (typeof PORTIONS)[number];

/** Ce que fait un bouton exposé de la fiche ou du document (ADR-11). */
export const ACTIONS = ["print", "download"] as const;

export type Action = (typeof ACTIONS)[number];

/**
 * La taille réellement imprimée d'un champ rempli du document R3, en points
 * (ADR-12). `field_id` est la clé du champ dans le DTO du cerfa, jamais son
 * texte.
 */
type FieldSize = { field_id: string; font_size_pt: number };

/**
 * Comment la page du simulateur s'est chargée, tel que le navigateur le dit
 * (`PerformanceNavigationTiming.type`) : ouverte, rechargée, ou rouverte par
 * l'historique (ADR-13).
 */
export const NAVIGATIONS = ["navigate", "reload", "back_forward"] as const;

export type Navigation = (typeof NAVIGATIONS)[number];

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
  /** La version des règles du modèle, celle de `rules/VERSION` (ADR-14). */
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
  /** `complete` ou `partial` : la mesure couvre tous les champs remplis du
   * document R3, ou non (ADR-12). */
  status?: string;
  field_group?: string;
  font_size_pt?: number;
  // Nos compléments.
  service_id?: string;
  page_view_id?: string;
  milestones?: Milestone[];
  financeur?: string;
  motifs?: string[];
  portions?: Portion[];
  sheet_id?: string;
  action?: Action;
  fields?: FieldSize[];
  unmeasured_field_ids?: string[];
  navigation?: Navigation;
  /** La version de l'app, celle de `package.json` (ADR-14). */
  app_version: string;
  /** Le commit déployé, sur 7 caractères, ou `inconnu` (ADR-14). */
  commit_sha: string;
};

/** L'app qui produit les événements : ses règles, sa version, son commit (ADR-14). */
export type Provenance = Pick<
  AnalyticsEvent,
  "version" | "app_version" | "commit_sha"
>;

/** Ce qu'un événement dit de lui-même : le parcours le numérote, le date, et dit sa provenance. */
export type EventDetails = Omit<
  AnalyticsEvent,
  "event_id" | "simulation_id" | "sequence" | "occurred_at" | keyof Provenance
>;
