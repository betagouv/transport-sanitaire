// Ce que le parcours d'une simulation garde au journal : un début, une seule
// intention, puis ses pages, ses questions et ses phases (ADR-8). Une seed
// n'est pas un parcours de prescripteur.

import { describe, expect, it } from "vitest";
import { Journey } from "../../../front/socle/analytics/journey.entity";
import type { OpenedPage } from "../../../front/socle/analytics/page-view.entity";

const entree = { establishment_id: "7", service_id: "42" };

// Une page de P2 qui n'est ni la première ni la dernière de la phase.
const pageDeP2 = (id: string, questions: string[]): OpenedPage => ({
  id,
  part: "P2",
  first: false,
  last: false,
  questions,
});

const types = (envoyes: { type: string }[]) => envoyes.map(({ type }) => type);

describe("le parcours d'une simulation", () => {
  it("numérote son début, puis son intention", () => {
    const journey = new Journey({ seeded: false });

    const debut = journey.start(entree);
    const intention = journey.selectIntent("eligibilite_seule");

    expect([debut?.sequence, intention?.sequence]).toEqual([1, 2]);
    expect(intention).toMatchObject({
      type: "intent_selected",
      intent: "eligibilite_seule",
      simulation_id: journey.simulationId,
    });
  });

  it("garde la première intention, pas un second choix", () => {
    const journey = new Journey({ seeded: false });
    journey.selectIntent("eligibilite_seule");

    expect(journey.selectIntent("eligibilite_et_prescription")).toBeNull();
  });

  it("ouvert sur une seed, ne garde rien", () => {
    const journey = new Journey({ seeded: true });

    expect([
      journey.start(entree),
      journey.selectIntent("eligibilite_seule"),
    ]).toEqual([null, null]);
  });

  it("une page validée qui reste dans sa phase ne la termine pas", () => {
    const journey = new Journey({ seeded: false });
    journey.openAPage(pageDeP2("P2/prestation", ["Q2.1"]));

    const validation = journey.validate({
      questions: ["Q2.1"],
      stillValidated: ["Q2.1"],
      nextPart: "P2",
    });

    expect(types(validation)).toEqual(["question_validated"]);
  });

  it("une page de P0 n'entre dans aucune phase, et n'a pas de jalon", () => {
    const journey = new Journey({ seeded: false });

    const ouverture = journey.openAPage({
      id: "P0",
      part: "P0",
      first: true,
      last: true,
      questions: ["Q0.1"],
    });

    expect(ouverture).toEqual([
      expect.objectContaining({ type: "question_exposed", screen: "P0" }),
    ]);
    expect(ouverture[0]).not.toHaveProperty("milestones");
  });

  it("la dernière page d'une phase vue, puis quittée sans validation, garde son jalon", () => {
    const journey = new Journey({ seeded: false });

    const [, exposition] = journey.openAPage({
      ...pageDeP2("P2/branche", ["Q2.13.depart"]),
      last: true,
    });

    expect(exposition).toMatchObject({
      type: "question_exposed",
      page_id: "P2/branche",
      milestones: ["last"],
    });
  });
});
