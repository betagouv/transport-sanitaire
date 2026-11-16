// Dire si la collecte marche : le signe de vie de l'heure, ou celui de l'heure
// d'avant, est-il dans le journal ? Une sonde externe le demande, et alerte
// quand il manque (ADR-15). L'heure d'avant suffit : au début d'une heure, le
// signe de vie de celle-ci n'est pas encore écrit.

import type { Journal } from "./journal.port.ts";
import { type Build, JournalEntry } from "./journal-entry.entity.ts";

export class CheckAlive {
  readonly #journal: Journal;
  readonly #build: Build;
  readonly #environment: string;

  constructor(journal: Journal, build: Build, environment: string) {
    this.#journal = journal;
    this.#build = build;
    this.#environment = environment;
  }

  /** Vrai si le journal porte un signe de vie de moins de deux heures. */
  async execute(now: Date): Promise<boolean> {
    const lastHour = new Date(now.getTime() - HOUR);
    return (await this.#writtenAt(now)) || (await this.#writtenAt(lastHour));
  }

  async #writtenAt(hour: Date): Promise<boolean> {
    const entry = JournalEntry.alive(hour, this.#build, this.#environment);
    return (await this.#journal.find(entry.eventId)) !== undefined;
  }
}

// ---- implémentation ----

const HOUR = 60 * 60 * 1000;
