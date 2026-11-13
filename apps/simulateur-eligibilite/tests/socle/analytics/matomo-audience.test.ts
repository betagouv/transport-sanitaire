// La mesure d'audience envoyée à Matomo, lue dans la file `_paq` du tag. Le
// choix du prescripteur est donné par le test ; le dialogue avec le CMS est
// éprouvé dans cms-consent.test.ts.

import { beforeEach, describe, expect, it } from "vitest";
import { AudienceEvent } from "../../../front/socle/analytics/audience-event.entity";
import type { Consent } from "../../../front/socle/analytics/consent.port";
import {
  configFromEnv,
  MatomoAudience,
} from "../../../front/socle/analytics/matomo-audience.adapter";
import { ConsentementDeTest } from "./consentement-de-test";

const config = { enabled: true, url: "https://matomo.test/", siteId: "275" };

// Le chargeur de matomo.js est remplacé par un relevé : pas de réseau en test.
let chargements: string[];
function matomo(choix?: Consent) {
  const consentement = new ConsentementDeTest(choix);
  const audience = new MatomoAudience(config, consentement, (url) =>
    chargements.push(url),
  );
  return { audience, consentement };
}

const trackEvents = () =>
  (window._paq ?? []).filter(([commande]) => commande === "trackEvent");

beforeEach(() => {
  window._paq = [];
  chargements = [];
});

describe("un événement envoyé à Matomo", () => {
  it("porte l'id du service en Nom, puis la valeur", () => {
    matomo("suivi").audience.track(
      new AudienceEvent("simulation_step", "42", 2),
    );

    expect(trackEvents()).toEqual([
      ["trackEvent", "simulateur", "simulation_step", "42", 2],
    ]);
  });

  it("sans service, n'a pas de Nom, et place un Nom vide avant la valeur", () => {
    const { audience } = matomo("suivi");
    audience.track(new AudienceEvent("simulation_start"));
    audience.track(new AudienceEvent("simulation_abandon", undefined, 3));

    expect(trackEvents()).toEqual([
      ["trackEvent", "simulateur", "simulation_start"],
      ["trackEvent", "simulateur", "simulation_abandon", "", 3],
    ]);
  });
});

describe("mesure selon le choix du prescripteur", () => {
  it("attend le choix avant la moindre mesure", () => {
    matomo().audience.track(new AudienceEvent("simulation_start"));

    expect(window._paq).toEqual([]);
    expect(chargements).toEqual([]);
  });

  it("au suivi accepté, amorce le traceur sans cookie, le charge, puis rejoue ce qui attendait", () => {
    const { audience, consentement } = matomo();
    audience.track(new AudienceEvent("simulation_start"));

    consentement.choisir("suivi");

    expect(window._paq).toEqual([
      ["disableCookies"],
      ["setTrackerUrl", "https://matomo.test/matomo.php"],
      ["setSiteId", "275"],
      ["trackPageView"],
      ["trackEvent", "simulateur", "simulation_start"],
    ]);
    expect(chargements).toEqual(["https://matomo.test/"]);
  });

  it("sur refus, ne charge pas Matomo et n'envoie rien", () => {
    const { audience, consentement } = matomo();
    audience.track(new AudienceEvent("simulation_start"));

    consentement.choisir("refus");
    audience.track(new AudienceEvent("simulation_step", undefined, 1));

    expect(window._paq).toEqual([]);
    expect(chargements).toEqual([]);
  });

  it("un refus en cours de session arrête la mesure", () => {
    const { audience, consentement } = matomo("suivi");

    consentement.choisir("refus");
    audience.track(new AudienceEvent("simulation_step", undefined, 1));

    expect(trackEvents()).toEqual([]);
  });

  it("une réactivation reprend la mesure, sans réamorcer le traceur", () => {
    const { audience, consentement } = matomo("suivi");
    consentement.choisir("refus");

    consentement.choisir("suivi");
    audience.track(new AudienceEvent("simulation_step", undefined, 1));

    expect(trackEvents()).toEqual([
      ["trackEvent", "simulateur", "simulation_step", "", 1],
    ]);
    expect(chargements).toHaveLength(1);
  });
});

describe("configFromEnv", () => {
  it("désactivé hors prod et sans flag", () => {
    expect(configFromEnv({ PROD: false }).enabled).toBe(false);
  });

  it("activé en build de prod", () => {
    expect(configFromEnv({ PROD: true }).enabled).toBe(true);
  });

  it("activable en local via VITE_MATOMO_ENABLED", () => {
    expect(
      configFromEnv({ PROD: false, VITE_MATOMO_ENABLED: "true" }).enabled,
    ).toBe(true);
  });

  it("défauts beta.gouv, surchargeables", () => {
    expect(configFromEnv({ PROD: true })).toMatchObject({
      url: "https://stats.beta.gouv.fr/",
      siteId: "275",
    });
    expect(
      configFromEnv({
        PROD: true,
        VITE_MATOMO_URL: "https://x/",
        VITE_MATOMO_SITE_ID: "9",
      }),
    ).toMatchObject({ url: "https://x/", siteId: "9" });
  });
});
