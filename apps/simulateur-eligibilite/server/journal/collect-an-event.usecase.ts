// Collecter un événement : le garder s'il est nouveau, ignorer un renvoi
// identique, et mettre à part un autre événement qui reprend le même
// `event_id` (ANA-1015 : deux contenus sous la même identité ne se fusionnent
// pas). La collecte ne connaît le stockage que par son port.

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
    const known = await this.#journal.find(entry.eventId);
    if (!known) {
      await this.#journal.append(entry);
      return "added";
    }
    if (entry.repeats(known)) return "duplicate";
    await this.#journal.setAside(entry);
    return "collision";
  }
}
