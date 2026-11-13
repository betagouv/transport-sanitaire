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
      changed: true,
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

// Le dernier R2 d'un parcours : ce qu'il affiche, et ses codes.
const unR2 = {
  canComplete: true,
  codes: {
    issue: "ISSUE_PMT",
    mode: null,
    reasonCodes: [],
    support: "S3138g",
    financeur: null,
  },
  motifs: ["E-B"],
  portions: [],
};

// La dernière page de P2 validée, ses réponses changées ou non.
function valider(journey: Journey, changed: boolean) {
  journey.openAPage(pageDeP2("P2/prestation", ["Q2.1"]));
  return journey.validate({
    questions: ["Q2.1"],
    stillValidated: ["Q2.1"],
    nextPart: null,
    changed,
  });
}

describe("les révisions du premier résultat", () => {
  it("un R2 affiché ouvre la révision r1, avec ses codes connus seulement", () => {
    const journey = new Journey({ seeded: false });

    const [affiche] = journey.displayResult(unR2);

    expect(affiche).toMatchObject({
      type: "result_displayed",
      screen: "R2",
      revision: "r1",
      can_complete: true,
      issue: "ISSUE_PMT",
      support: "S3138g",
      reason_codes: [],
      motifs: ["E-B"],
      portions: [],
    });
    expect(affiche).not.toHaveProperty("mode");
    expect(affiche).not.toHaveProperty("financeur");
  });

  it("un R2 réaffiché sans modification garde sa révision, et ne repart pas", () => {
    const journey = new Journey({ seeded: false });
    journey.displayResult(unR2);

    const revalidation = valider(journey, false);

    expect(types(revalidation)).not.toContain("result_invalidated");
    expect(journey.displayResult(unR2)).toEqual([]);
  });

  it("une modification de P2 fait tomber la révision, et le R2 suivant ouvre r2", () => {
    const journey = new Journey({ seeded: false });
    journey.displayResult(unR2);

    const modification = valider(journey, true);
    const [suivant] = journey.displayResult(unR2);

    expect(modification).toContainEqual(
      expect.objectContaining({
        type: "result_invalidated",
        screen: "P2",
        revision: "r1",
      }),
    );
    expect(suivant?.revision).toBe("r2");
  });

  it("sans R2 affiché, une modification ne fait rien tomber", () => {
    const journey = new Journey({ seeded: false });

    expect(types(valider(journey, true))).not.toContain("result_invalidated");
  });

  it("l'entrée en P3 porte la révision courante", () => {
    const journey = new Journey({ seeded: false });
    journey.displayResult(unR2);

    const [entree] = journey.openAPage({
      id: "P3/lieux",
      part: "P3",
      first: true,
      last: false,
      questions: ["Q3.1"],
    });

    expect(entree).toMatchObject({
      type: "phase_entered",
      screen: "P3",
      revision: "r1",
    });
  });

  it("une page de P3 qui change les réponses ne touche pas au R2", () => {
    const journey = new Journey({ seeded: false });
    journey.displayResult(unR2);
    journey.openAPage({
      id: "P3/lieux",
      part: "P3",
      first: true,
      last: true,
      questions: ["Q3.1"],
    });

    const validation = journey.validate({
      questions: ["Q3.1"],
      stillValidated: ["Q3.1"],
      nextPart: null,
      changed: true,
    });

    expect(types(validation)).not.toContain("result_invalidated");
  });
});
