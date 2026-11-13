// Dire que la collecte marche : écrire dans le journal le signe de vie de
// l'heure, s'il n'y est pas déjà. Une heure sans signe de vie ressort
// « indisponible », pas « zéro » (ADR-15). Si le journal n'écrit plus, le signe
// de vie manque aussi : la coupure se voit sans rien de plus.

import type { Journal } from "./journal.port.ts";
import { type Build, JournalEntry } from "./journal-entry.entity.ts";

export class ReportAlive {
  readonly #journal: Journal;
  readonly #build: Build;
  readonly #environment: string;

  constructor(journal: Journal, build: Build, environment: string) {
    this.#journal = journal;
    this.#build = build;
    this.#environment = environment;
  }

  async execute(now: Date): Promise<void> {
    const entry = JournalEntry.alive(now, this.#build, this.#environment);
    if (await this.#journal.find(entry.eventId)) return;
    await this.#journal.append(entry);
  }
}
