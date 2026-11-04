import { beforeEach, describe, expect, it } from "vitest";
import { EventName, trackEvent } from "../../../front/socle/analytics/events";
import { initAnalytics } from "../../../front/socle/analytics/matomo";
import { rangerRattachement } from "../../../front/socle/rattachement";
import type { RattachementSaisi } from "../../../shared/rattachement-saisi";

const rattachement: RattachementSaisi = { etabId: "7", serviceId: "42" };

beforeEach(() => {
  window._paq = [];
  rangerRattachement(null);
  initAnalytics({ enabled: true, url: "https://matomo.test/", siteId: "275" });
  window._paq = []; // isole les événements des commandes d'amorçage
});

describe("référentiel des évènements", () => {
  it("émet le nom fixe de l'évènement, avec le service de la session", () => {
    rangerRattachement(rattachement);
    trackEvent(EventName.simulationStart);
    trackEvent(EventName.simulationStep, 3);
    expect(window._paq).toEqual([
      ["trackEvent", "simulateur", "simulation_start", "42"],
      ["trackEvent", "simulateur", "simulation_step", "42", 3],
    ]);
  });

  it("émet sans Nom tant que personne ne s'est rattaché", () => {
    trackEvent(EventName.simulationStart);
    expect(window._paq).toEqual([
      ["trackEvent", "simulateur", "simulation_start"],
    ]);
  });
});
