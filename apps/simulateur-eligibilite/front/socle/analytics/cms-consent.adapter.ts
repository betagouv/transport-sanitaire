// Le choix du prescripteur, tenu par le CMS.
//
// L'app tourne dans une iframe du CMS. C'est le CMS qui propose l'opt-out et qui
// nous transmet le choix par `postMessage`. Son script est `cms.js`, ici.
// Voir docs/knowledge/adr/analytics.md, ADR-5.

import type { Consent, ConsentSource } from "./consent.port";

export type CmsConsentOptions = {
  /** La page qui embarque l'app (défaut : `window.parent`). */
  parent?: Window;
  /** Passé ce délai sans réponse, la mesure continue. */
  delaiMs?: number;
};

/**
 * Demande le choix à la page qui embarque l'app au premier `follow`, puis le
 * suit. Hors iframe, ou sans réponse dans le délai, la mesure continue :
 * l'opt-out n'existe que là où le CMS l'offre. Matomo et le journal suivent le
 * même choix, demandé une fois.
 *
 * Seule la page parente est écoutée. Son origine n'est pas vérifiée : le message
 * ne porte aucune donnée, il arrête ou reprend notre propre mesure.
 */
export class CmsConsent implements ConsentSource {
  readonly #parent: Window;
  readonly #delaiMs: number;
  readonly #listeners: ((choice: Consent) => void)[] = [];
  #choice: Consent | undefined;
  #asked = false;

  constructor({
    parent = window.parent,
    delaiMs = DELAI_MS,
  }: CmsConsentOptions = {}) {
    this.#parent = parent;
    this.#delaiMs = delaiMs;
  }

  follow(onChoice: (choice: Consent) => void): void {
    this.#listeners.push(onChoice);
    if (this.#choice) onChoice(this.#choice);
    if (!this.#asked) this.#ask();
  }

  #ask() {
    this.#asked = true;
    if (this.#parent === window) return this.#choose("suivi");
    window.addEventListener("message", (e) => {
      const choice = e.source === this.#parent ? lireChoix(e.data) : null;
      if (choice) this.#choose(choice);
    });
    this.#parent.postMessage({ type: DEMANDE }, "*");
    setTimeout(() => {
      if (!this.#choice) this.#choose("suivi");
    }, this.#delaiMs);
  }

  #choose(choice: Consent) {
    this.#choice = choice;
    for (const listener of this.#listeners) listener(choice);
  }
}

// ---- implémentation ----

// Le protocole, que le script du CMS implémente à l'identique.
const DEMANDE = "statistiques-simulateur:demande";
const CHOIX = "statistiques-simulateur:choix";

// Court : la page vue attend la réponse, et le CMS répond dès la demande.
const DELAI_MS = 1000;

function lireChoix(data: unknown): Consent | null {
  if (typeof data !== "object" || data === null) return null;
  const message = data as { type?: unknown; suivi?: unknown };
  if (message.type !== CHOIX || typeof message.suivi !== "boolean") return null;
  return message.suivi ? "suivi" : "refus";
}
