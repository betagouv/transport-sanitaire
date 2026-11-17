// Collecter un événement : le garder s'il est nouveau, ignorer un renvoi
// identique, et mettre à part un autre événement qui reprend le même
// `event_id` (ANA-1015 : deux contenus sous la même identité ne se fusionnent
// pas). Un document n'a qu'une taille de champs : sa mesure rejouée sous un
// autre `event_id` est ignorée, une mesure contradictoire mise à part
// (ANA22-03). La collecte ne connaît le stockage que par son port.

import type { AnalyticsEvent } from "../../shared/analytics/analytics-event.ts";
import type { Journal } from "./journal.port.ts";
import { JournalEntry } from "./journal-entry.entity.ts";

export type Collected = "added" | "duplicate" | "collision";

export class CollectAnEvent {
  readonly #journal: Journal;
  readonly #environment: string;

  constructor(journal: Journal, environment: string) {
    this.#journal = journal;
    this.#environment = environment;
  }

  async execute(event: AnalyticsEvent): Promise<Collected> {
    const entry = JournalEntry.receivedNow(event, this.#environment);
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

  // La mesure déjà reçue du document que cet événement mesure.
  #measureOfItsDocument({ type, simulation_id, document_id }: AnalyticsEvent) {
    if (type !== "document_typography_measured" || !document_id)
      return undefined;
    return this.#journal.findMeasurement(simulation_id, document_id);
  }
}
