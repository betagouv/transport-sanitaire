// Comment la page s'est chargée (ADR-13). L'app tourne dans une iframe du CMS :
// quand le prescripteur recharge la page du CMS, l'iframe se dit ouverte, pas
// rechargée. C'est donc le CMS qui donne son propre chargement, par
// `postMessage`, à la demande. Son script est `cms.js`. Hors iframe, l'app lit
// le sien.

import {
  NAVIGATIONS,
  type Navigation,
} from "../../../shared/analytics/analytics-event";
import type { PageLoad, UnknownNavigation } from "./page-load.port";

export type HostPageLoadOptions = {
  /** La page qui embarque l'app (défaut : `window.parent`). */
  parent?: Window;
};

/**
 * Demande son chargement à la page qui embarque l'app dès sa création : le
 * conteneur la crée au démarrage, bien avant que le rattachement ouvre la
 * première simulation. Tant que la page n'a pas répondu, le chargement est
 * inconnu.
 *
 * Seule la page parente est écoutée. Son origine n'est pas vérifiée : le
 * message ne porte qu'un type de chargement, que le contrat borne.
 */
export class HostPageLoad implements PageLoad {
  #navigation: Navigation | UnknownNavigation;

  constructor({ parent = window.parent }: HostPageLoadOptions = {}) {
    if (parent === window) {
      this.#navigation = navigationOf(ownNavigation());
      return;
    }
    window.addEventListener("message", (e) => {
      if (e.source === parent) this.#navigation ??= read(e.data);
    });
    parent.postMessage({ type: DEMANDE }, "*");
  }

  navigation(): Navigation | UnknownNavigation {
    return this.#navigation;
  }
}

// ---- implémentation ----

// Le protocole, que le script du CMS implémente à l'identique.
const DEMANDE = "chargement-simulateur:demande";
const CHARGEMENT = "chargement-simulateur:type";

function ownNavigation(): unknown {
  const [entry] = window.performance?.getEntriesByType?.("navigation") ?? [];
  return (entry as PerformanceNavigationTiming | undefined)?.type;
}

function read(data: unknown): Navigation | UnknownNavigation {
  if (typeof data !== "object" || data === null) return undefined;
  const message = data as { type?: unknown; navigation?: unknown };
  return message.type === CHARGEMENT
    ? navigationOf(message.navigation)
    : undefined;
}

function navigationOf(type: unknown): Navigation | UnknownNavigation {
  return NAVIGATIONS.find((navigation) => navigation === type);
}
