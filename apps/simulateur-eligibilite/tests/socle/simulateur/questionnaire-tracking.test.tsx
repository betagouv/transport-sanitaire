import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { initAnalytics, initJournal } from "../../../front/socle/analytics";
import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event";
import {
  ACCOMPAGNEMENTS,
  allerAuResultat,
  bouton,
  ouvrirLeSimulateur,
  QUANTITE,
  question,
} from "./questionnaire";

// Ce que le questionnaire signale à Matomo, lu dans la file `_paq` : son début,
// ses étapes, sa fin. Le service est celui du rattachement de test.

const evenements = () =>
  (window._paq as unknown[][])
    .filter(([commande]) => commande === "trackEvent")
    .map(([, , nom, , valeur]) => (valeur === undefined ? nom : [nom, valeur]));

beforeEach(() => {
  window._paq = [];
  initAnalytics({ enabled: true, url: "https://matomo.test/", siteId: "275" });
});

describe("suivi du parcours", () => {
  it("émet le début, chaque étape franchie et la conclusion", async () => {
    const user = await ouvrirLeSimulateur();

    await allerAuResultat(user);

    expect(evenements()).toEqual([
      "simulation_start",
      ["simulation_step", 2],
      "simulation_complete",
    ]);
  });

  it("ne réémet pas de début au retour depuis le résultat", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);

    await user.click(bouton("Précédent"));
    await question(ACCOMPAGNEMENTS);

    expect(
      evenements().filter((evenement) => evenement === "simulation_start"),
    ).toHaveLength(1);
  });

  it("envoie au journal un seul début, avec l'établissement et le service", async () => {
    const envoyes: AnalyticsEvent[] = [];
    initJournal(async (evenement) => {
      envoyes.push(evenement);
    });
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);

    await user.click(bouton("Précédent"));
    await question(ACCOMPAGNEMENTS);

    expect(envoyes).toEqual([
      expect.objectContaining({
        type: "simulation_started",
        sequence: 1,
        screen: "P0",
        version: "10.1.7",
        establishment_id: "e_chu_grenoble",
        service_id: "s_grenoble_cardio",
        is_test: false,
      }),
    ]);
  });

  it("n'émet rien dans le complément", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuResultat(user);
    const avant = evenements();

    await user.click(bouton("Compléter la commande"));
    await user.type(screen.getByRole("spinbutton", QUANTITE), "2");
    await user.click(bouton("Terminer"));

    expect(evenements()).toEqual(avant);
  });
});
