// L'envoi d'un événement au journal des parcours, par la route de collecte du
// backend (ADR-6 d'analytics.md).
//
// Chaque événement part seul, dans un `fetch` en `keepalive`, qui survit à la
// fermeture de l'onglet. Sur une erreur réseau ou une réponse 5xx, il réessaie
// après chaque délai, puis abandonne. Une réponse 4xx ne se réessaie pas : le
// serveur a refusé l'événement. Il n'y a ni file ni stockage : une perte se lit
// dans le journal, par un trou dans les `sequence` d'une simulation.
//
// L'opt-out du CMS vaut aussi pour le journal (ADR-5) : rien ne part avant le
// choix du prescripteur, ni après un refus.

import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event";
import { type BridgeOptions, type Consent, followConsent } from "./consent";

export type JournalOptions = BridgeOptions & {
  /** La route de collecte (défaut : celle du backend, même origine). */
  endpoint?: string;
  /** Les attentes avant chaque nouvelle tentative, en millisecondes. */
  delays?: number[];
};

export type SendAnEvent = (event: AnalyticsEvent) => Promise<void>;

export function sendToTheJournal({
  endpoint = ENDPOINT,
  delays = DELAYS,
  ...bridge
}: JournalOptions = {}): SendAnEvent {
  let choice: Consent | undefined;
  const chosen = new Promise<void>((resolve) =>
    followConsent((c) => {
      choice = c;
      resolve();
    }, bridge),
  );
  return async (event) => {
    await chosen;
    if (choice === "refus") return;
    for (const delay of [0, ...delays]) {
      if (delay) await wait(delay);
      if (!(await failsForNow(endpoint, event))) return;
    }
  };
}

// ---- implémentation ----

const ENDPOINT = "/api/journal/v1/events";

// Un peu moins de 8 secondes en tout.
const DELAYS = [500, 1000, 2000, 4000];

// Vrai si l'envoi peut encore réussir plus tard : le réseau a coupé, ou le
// serveur n'a pas pu écrire.
async function failsForNow(endpoint: string, event: AnalyticsEvent) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    return response.status >= 500;
  } catch {
    return true;
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
