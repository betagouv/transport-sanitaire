// Ce que le parcours d'une simulation garde au journal : un début, puis une
// seule intention. Une seed n'est pas un parcours de prescripteur.

import { describe, expect, it } from "vitest";
import { Journey } from "../../../front/socle/analytics/journey.entity";

const entree = { establishment_id: "7", service_id: "42" };

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
});
