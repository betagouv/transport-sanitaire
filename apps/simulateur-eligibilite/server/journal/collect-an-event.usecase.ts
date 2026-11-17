// Collecter un événement : le garder s'il est nouveau, ignorer un renvoi
// identique, et mettre à part un autre événement qui reprend le même
// `event_id` (ANA-1015 : deux contenus sous la même identité ne se fusionnent
// pas). Un document n'a qu'une taille de champs : sa mesure rejouée sous un
// autre `event_id` est ignorée, une mesure contradictoire mise à part
// (ANA22-03). Un événement dont l'établissement n'est pas au référentiel, ou
// dont le service n'est pas sous son établissement, va en quarantaine
// (ANA22-01). La collecte ne connaît le stockage et le référentiel que par
// leurs ports.

import type { AnalyticsEvent } from "../../shared/analytics/analytics-event.ts";
import type { Journal, QuarantineReason } from "./journal.port.ts";
import { type Build, JournalEntry } from "./journal-entry.entity.ts";
import type { KnownRattachements } from "./known-rattachements.port.ts";

export type Collected = "added" | "duplicate" | "collision" | "quarantined";

/** L'événement n'a pas de rattachement, ou le référentiel le connaît. */
type InTheReferentiel = undefined;

export class CollectAnEvent {
  readonly #journal: Journal;
  readonly #rattachements: KnownRattachements;
  readonly #environment: string;
  readonly #build: Build;

  constructor(
    journal: Journal,
    rattachements: KnownRattachements,
    environment: string,
    build: Build,
  ) {
    this.#journal = journal;
    this.#rattachements = rattachements;
    this.#environment = environment;
    this.#build = build;
  }

  async execute(event: AnalyticsEvent): Promise<Collected> {
    const entry = JournalEntry.receivedNow(
      event,
      this.#environment,
      this.#build.commit_sha,
    );
    const outside = await this.#outsideTheReferentiel(event);
    if (outside) {
      await this.#journal.quarantine(entry, outside);
      return "quarantined";
    }
    const known =
      (await this.#journal.find(entry.eventId)) ??
      (await this.#measureOfItsDocument(event));
    if (!known) {
      await this.#journal.append(entry);
      return "added";
    }
    if (entry.repeats(known)) return "duplicate";
    await this.#journal.setAside(entry);
    return "collision";
  }

  // Ce que le référentiel ne connaît pas du rattachement de l'événement. Le
  // contrat garantit qu'un service vient avec son établissement.
  async #outsideTheReferentiel(
    event: AnalyticsEvent,
  ): Promise<QuarantineReason | InTheReferentiel> {
    if (!event.establishment_id) return undefined;
    const { establishment_id, service_id } = event;
    if (!(await this.#rattachements.hasEstablishment(establishment_id))) {
      return "unknown_establishment";
    }
    if (
      service_id &&
      !(await this.#rattachements.hasService(establishment_id, service_id))
    ) {
      return "service_outside_establishment";
    }
    return undefined;
  }

  // La mesure déjà reçue du document que cet événement mesure.
  #measureOfItsDocument({ type, simulation_id, document_id }: AnalyticsEvent) {
    if (type !== "document_typography_measured" || !document_id)
      return undefined;
    return this.#journal.findMeasurement(simulation_id, document_id);
  }
}
