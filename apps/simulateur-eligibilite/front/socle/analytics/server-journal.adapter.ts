// Le journal des parcours tenu par le backend, par sa route de collecte
// (ADR-6 d'analytics.md).
//
// Chaque événement part seul, en `keepalive`, qui survit à la fermeture de
// l'onglet. Sur une erreur réseau ou une réponse 5xx, il réessaie après chaque
// délai, puis abandonne. Une réponse 4xx ne se réessaie pas : le serveur a
// refusé l'événement. Il n'y a ni file ni stockage : une perte se lit dans le
// journal, par un trou dans les `sequence` d'une simulation.
//
// L'opt-out du CMS vaut aussi pour le journal (ADR-5) : rien ne part avant le
// choix du prescripteur, ni après un refus.

import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event";
import { ServerApiClient, ServerApiError } from "../server-api";
import type { Consent, ConsentSource } from "./consent.port";
import type { Journal } from "./journal.port";

export type ServerJournalOptions = {
  api?: ServerApiClient;
  /** Les attentes avant chaque nouvelle tentative, en millisecondes. */
  delays?: number[];
};

export class ServerJournal implements Journal {
  readonly #api: ServerApiClient;
  readonly #delays: number[];
  readonly #chosen: Promise<void>;
  #choice: Consent | undefined;

  constructor(
    consent: ConsentSource,
    { api = new ServerApiClient(), delays = DELAYS }: ServerJournalOptions = {},
  ) {
    this.#api = api;
    this.#delays = delays;
    this.#chosen = new Promise((resolve) =>
      consent.follow((choice) => {
        this.#choice = choice;
        resolve();
      }),
    );
  }

  async record(event: AnalyticsEvent): Promise<void> {
    await this.#chosen;
    if (this.#choice === "refus") return;
    for (const delay of [0, ...this.#delays]) {
      if (delay) await wait(delay);
      if (!(await this.#failsForNow(event))) return;
    }
  }

  // Vrai si l'envoi peut encore réussir plus tard : le réseau a coupé, ou le
  // serveur n'a pas pu écrire.
  async #failsForNow(event: AnalyticsEvent): Promise<boolean> {
    try {
      await this.#api.post(COLLECT, event, { keepalive: true });
      return false;
    } catch (error) {
      return !(error instanceof ServerApiError && error.status < 500);
    }
  }
}

// ---- implémentation ----

const COLLECT = "/journal/v1/events";

// Un peu moins de 8 secondes en tout.
const DELAYS = [500, 1000, 2000, 4000];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
