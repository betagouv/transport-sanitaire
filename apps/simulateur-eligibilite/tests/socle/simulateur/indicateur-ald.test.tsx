import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { constant } from "../../../core/socle/questionnaire-engine/condition";
import { initAnalytics } from "../../../front/socle/analytics/matomo";
import type { AldIndicator, Model } from "../../../front/socle/model";
import { given, modeleDeTest } from "../modele-de-test";
import {
  ACCOMPAGNEMENTS,
  allerAuResultat,
  BOISSON,
  bouton,
  caseACocher,
  ouvrirLeSimulateur,
  question,
  radio,
} from "./questionnaire";

// L'indicateur de parcours ALD (#148), sur le modèle factice : un thé tient lieu
// de parcours ALD. À chaque arrivée sur le premier résultat, un verdict part
// vers Matomo, avec le nombre de questions posées et rien des réponses.

const INDICATEUR: AldIndicator = {
  parts: ["commande"],
  limit: 2,
  counted: given.question("boisson").answer().is("the"),
  caisse: constant(false),
};

const avec = (changement: Partial<AldIndicator> = {}): Model => ({
  ...modeleDeTest,
  aldIndicator: { ...INDICATEUR, ...changement },
});

const trackEvents = () =>
  (window._paq as unknown[][]).filter(
    ([commande]) => commande === "trackEvent",
  );

const verdicts = () =>
  trackEvents()
    .map(([, , nom]) => nom)
    .filter((nom) => String(nom).startsWith("parcours_ald_"));

beforeEach(() => {
  window._paq = [];
  initAnalytics({ enabled: true, url: "https://matomo.test/", siteId: "275" });
});

describe("l'indicateur de parcours ALD", () => {
  it("envoie le verdict avec le service et le nombre de questions, sans réponse", async () => {
    const user = await ouvrirLeSimulateur({ modele: avec() });

    await allerAuResultat(user);

    const service = trackEvents().find(
      ([, , nom]) => nom === "simulation_complete",
    )?.[3];
    expect(trackEvents().at(-1)).toEqual([
      "trackEvent",
      "simulateur",
      "parcours_ald_dans_la_cible",
      service,
      2,
    ]);
  });

  it("dit trop de pages au-delà de la limite", async () => {
    const user = await ouvrirLeSimulateur({ modele: avec({ limit: 1 }) });

    await allerAuResultat(user);

    expect(verdicts()).toEqual(["parcours_ald_trop_de_pages"]);
  });

  it("met à part un parcours qui finit à la caisse", async () => {
    const modele = avec({ caisse: constant(true) });
    const user = await ouvrirLeSimulateur({ modele });

    await allerAuResultat(user);

    expect(verdicts()).toEqual(["parcours_ald_caisse"]);
  });

  it("n'envoie rien pour un parcours qui ne compte pas", async () => {
    const user = await ouvrirLeSimulateur({ modele: avec() });

    await question(BOISSON);
    await user.click(radio("Un café"));
    await question(ACCOMPAGNEMENTS);
    await user.click(caseACocher("Du lait"));
    await user.click(bouton("Voir le résultat"));
    await screen.findByRole("heading", { level: 1, name: "Votre commande" });

    expect(verdicts()).toEqual([]);
  });

  it("envoie un verdict à chaque arrivée sur le résultat (D-230)", async () => {
    const user = await ouvrirLeSimulateur({ modele: avec() });
    await allerAuResultat(user);

    await user.click(bouton("Précédent"));
    await question(ACCOMPAGNEMENTS);
    await user.click(bouton("Voir le résultat"));
    await screen.findByRole("heading", { level: 1, name: "Votre commande" });

    expect(verdicts()).toEqual([
      "parcours_ald_dans_la_cible",
      "parcours_ald_dans_la_cible",
    ]);
  });
});
