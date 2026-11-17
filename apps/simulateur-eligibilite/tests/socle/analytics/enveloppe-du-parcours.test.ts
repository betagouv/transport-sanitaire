// L'enveloppe de chaque événement d'un parcours, celle du contrat v10.2.2 :
// le contrat, le modèle, le build, le numéro et l'origine. Et la fermeture,
// qui suit le dernier numéro et clôt le parcours (#497).

import { describe, expect, it } from "vitest";
import { Journey } from "../../../front/socle/analytics/journey.entity";
import type { OpenedPage } from "../../../front/socle/analytics/page-view.entity";
import { PROVENANCE } from "./journal-de-test";

const pageDeP2 = (id: string, questions: string[]): OpenedPage => ({
  id,
  part: "P2",
  first: false,
  last: false,
  questions,
});

describe("l'enveloppe d'un parcours", () => {
  it("dit sur chaque événement le contrat, le modèle, le build et son origine", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

    const envoyes = [
      journey.start(),
      ...journey.openAPage(pageDeP2("P2/prestation", ["Q2.1"])),
    ];

    for (const evenement of envoyes) {
      expect(evenement).toMatchObject({
        version: "10.2.2",
        model_version: "10.2.1",
        app_version: "0.8.0",
        activity_origin: "user",
      });
    }
  });

  it("fermé pour une nouvelle simulation, le dit sous le numéro suivant, puis ne garde plus rien", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    journey.start();
    journey.openAPage(pageDeP2("P2/prestation", ["Q2.1"]));

    const fermeture = journey.close("new_simulation");

    expect(fermeture).toMatchObject({
      type: "simulation_closed",
      closure_reason: "new_simulation",
      sequence: 4,
    });
    expect(journey.close("new_simulation")).toBeNull();
    expect(journey.openAPage(pageDeP2("P2/suite", ["Q2.2"]))).toEqual([]);
  });
});
