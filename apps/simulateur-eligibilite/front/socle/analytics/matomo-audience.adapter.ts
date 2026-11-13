// La mesure d'audience envoyée à Matomo : démarrage du tag, chargement du
// script, mise en forme d'un `trackEvent`.

import type { Audience } from "./audience.port";
import type { AudienceEvent } from "./audience-event.entity";
import type { Consent, ConsentSource } from "./consent.port";

declare global {
  interface Window {
    // La file d'attente du tag Matomo. Ce qu'on y empile avant le chargement de
    // matomo.js est rejoué par le script.
    _paq?: unknown[][];
  }
}

export type MatomoConfig = {
  enabled: boolean;
  url: string;
  siteId: string;
};

/**
 * Lit la configuration dans l'environnement. Le traceur n'est activé qu'en
 * build de prod, ou avec `VITE_MATOMO_ENABLED=true` pour tester en local. Il ne
 * demande pas de consentement : la mesure, agrégée par service, reste dans
 * l'exemption CNIL (ADR-3 d'analytics.md).
 */
export function configFromEnv(env: Env = import.meta.env): MatomoConfig {
  return {
    enabled: env.PROD === true || env.VITE_MATOMO_ENABLED === "true",
    url: env.VITE_MATOMO_URL || DEFAULT_URL,
    siteId: env.VITE_MATOMO_SITE_ID || DEFAULT_SITE_ID,
  };
}

/** Injecte le script matomo.js, qui traitera la file. Idempotent. */
export function loadMatomo(url: string): void {
  if (document.getElementById("matomo-js")) return;
  const script = document.createElement("script");
  script.id = "matomo-js";
  script.async = true;
  script.src = `${url}matomo.js`;
  document.head.appendChild(script);
}

/**
 * Le traceur attend le choix du prescripteur : rien n'est mesuré ni chargé
 * avant. Au premier suivi, il amorce `_paq` et charge matomo.js (`load`, rien
 * par défaut : `container.ts` passe `loadMatomo`, et les tests restent sans
 * réseau). Ce qui attendait est alors rejoué. Au refus, il jette l'attente et
 * n'émet plus rien, ce qui suffit : matomo.js ne mesure rien de lui-même.
 */
export class MatomoAudience implements Audience {
  readonly #config: MatomoConfig;
  readonly #load: (url: string) => void;
  #choice: Consent | "en-attente" = "en-attente";
  // Les événements émis avant le choix, rejoués au suivi.
  #pending: unknown[][] = [];
  #bootstrapped = false;

  constructor(
    config: MatomoConfig,
    consent: ConsentSource,
    load: (url: string) => void = () => {},
  ) {
    this.#config = config;
    this.#load = load;
    consent.follow((choice) => this.#apply(choice));
  }

  track(event: AudienceEvent): void {
    if (this.#choice === "refus") return;
    const command = trackEventOf(event);
    if (this.#choice === "en-attente") this.#pending.push(command);
    else queue().push(command);
  }

  #apply(choice: Consent) {
    const pending = this.#pending;
    this.#pending = [];
    this.#choice = choice;
    if (choice === "refus") return;
    if (!this.#bootstrapped) this.#bootstrap();
    queue().push(...pending);
  }

  // Le traceur est sans cookie (`disableCookies`). L'app tourne dans l'iframe
  // du CMS, un contexte tiers où les cookies sont bloqués, et la mesure se veut
  // sans bandeau. L'IP s'anonymise côté instance Matomo : l'API JS ne le
  // permet pas.
  #bootstrap() {
    const { url, siteId } = this.#config;
    queue().push(
      ["disableCookies"],
      ["setTrackerUrl", `${url}matomo.php`],
      ["setSiteId", siteId],
      ["trackPageView"],
    );
    this.#load(url);
    this.#bootstrapped = true;
  }
}

// ---- implémentation ----

type Env = {
  PROD?: boolean;
  VITE_MATOMO_ENABLED?: string;
  VITE_MATOMO_URL?: string;
  VITE_MATOMO_SITE_ID?: string;
};

const CATEGORY = "simulateur";
// Instance mutualisée beta.gouv, site 275. On passe par le tag de suivi (`_paq`
// et matomo.js), pas par le Tag Manager.
const DEFAULT_URL = "https://stats.beta.gouv.fr/";
const DEFAULT_SITE_ID = "275";

// Le seul endroit qui crée la file. Quand matomo.js se charge, le tag la
// remplace par un objet actif et rejoue ce qui était empilé.
function queue(): unknown[][] {
  window._paq ??= [];
  return window._paq;
}

// Un `trackEvent` : une catégorie constante, le nom en action, l'id du service
// en Nom s'il existe, puis la valeur. L'instance mutualisée beta.gouv n'offre
// pas de custom dimension (risque R-8) : le service est porté par l'événement.
function trackEventOf({ name, serviceId, value }: AudienceEvent): unknown[] {
  const command: unknown[] = ["trackEvent", CATEGORY, name];
  if (serviceId !== undefined) command.push(serviceId);
  if (value !== undefined) {
    if (serviceId === undefined) command.push(""); // le Nom précède la Valeur
    command.push(value);
  }
  return command;
}
