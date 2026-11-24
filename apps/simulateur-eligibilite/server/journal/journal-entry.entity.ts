// Une entrée du journal des parcours : un événement tel que le navigateur l'a
// envoyé, daté à sa réception par le serveur, avec le commit du serveur qui l'a
// reçu, ou le signe de vie que le serveur écrit chaque heure. Voir
// ADR-0042.

import { isDeepStrictEqual } from "node:util";
import {
  type AnalyticsEvent,
  SCHEMA_VERSION,
} from "../../shared/analytics/analytics-event.ts";

/**
 * Ce que le serveur sait de l'app qu'il sert : sa version, et son commit sur 7
 * caractères, ou `inconnu`.
 */
export type Build = { app_version: string; commit_sha: string };

/**
 * Le signe de vie de la collecte : le serveur l'écrit chaque heure. Une heure
 * sans lui est une heure sans collecte, pas une heure sans usage. Il
 * n'appartient à aucune simulation.
 */
export type AliveEvent = Build & {
  event_id: string;
  type: "alive";
  occurred_at: string;
  simulation_id?: never;
  sequence?: never;
  is_test?: never;
};

export class JournalEntry {
  readonly event: AnalyticsEvent | AliveEvent;
  readonly receivedAt: string;
  /** Où le serveur tourne : production, staging, local… */
  readonly environment: string;
  /** Le commit du serveur qui l'a reçu : le contrat ne le porte pas. */
  readonly commitSha: string;
  /** La version de nos compléments au contrat d'ANA-1015. */
  readonly schemaVersion: number;

  constructor(
    event: AnalyticsEvent | AliveEvent,
    receivedAt: string,
    environment: string,
    commitSha: string,
    schemaVersion: number = SCHEMA_VERSION,
  ) {
    this.event = event;
    this.receivedAt = receivedAt;
    this.environment = environment;
    this.commitSha = commitSha;
    this.schemaVersion = schemaVersion;
  }

  /** L'événement, reçu à l'instant par le serveur de ce commit. */
  static receivedNow(
    event: AnalyticsEvent,
    environment: string,
    commitSha: string,
  ): JournalEntry {
    const at = new Date().toISOString();
    return new JournalEntry(event, at, environment, commitSha);
  }

  /**
   * Le signe de vie de l'heure en cours. Son identifiant tient l'heure et la
   * version : deux serveurs de la même version n'écrivent qu'une ligne par
   * heure, et une version qui démarre en cours d'heure a la sienne.
   */
  static alive(now: Date, build: Build, environment: string): JournalEntry {
    const at = now.toISOString();
    const hour = at.slice(0, "2026-11-13T15".length);
    const { app_version, commit_sha } = build;
    const event: AliveEvent = {
      event_id: `alive:${hour}:${app_version}:${commit_sha}`,
      type: "alive",
      occurred_at: at,
      app_version,
      commit_sha,
    };
    return new JournalEntry(event, at, environment, commit_sha);
  }

  get eventId(): string {
    return this.event.event_id;
  }

  /** Vrai si elle porte la taille des champs de ce document (ANA22-03). */
  measures(simulationId: string, documentId: string): boolean {
    const { event } = this;
    return (
      event.type === MEASUREMENT &&
      event.simulation_id === simulationId &&
      event.document_id === documentId
    );
  }

  /**
   * Vrai si l'autre entrée porte le même événement : c'est un renvoi. Une
   * mesure l'est aussi quand elle redit celle du même document, sous un autre
   * `event_id` : son contenu ne change pas (ANA22-03).
   */
  repeats(other: JournalEntry): boolean {
    const measure = measureOf(this.event);
    return (
      isDeepStrictEqual(this.event, other.event) ||
      (measure !== undefined &&
        isDeepStrictEqual(measure, measureOf(other.event)))
    );
  }
}

// ---- implémentation ----

const MEASUREMENT = "document_typography_measured";

/** L'entrée ne porte pas de mesure. */
type NoMeasure = undefined;

/** Une mesure, sans ce qui date ou numérote son envoi. */
type Measure = Omit<AnalyticsEvent, "event_id" | "sequence" | "occurred_at">;

// Ce qu'une mesure dit de son document : deux envois de la même mesure ne
// diffèrent que par leur identifiant, leur rang et leur date.
function measureOf(event: JournalEntry["event"]): Measure | NoMeasure {
  if (event.type !== MEASUREMENT) return undefined;
  const {
    event_id: _id,
    sequence: _rank,
    occurred_at: _at,
    ...measure
  } = event;
  return measure;
}
