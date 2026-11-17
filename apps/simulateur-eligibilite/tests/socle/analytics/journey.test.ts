// Ce que le parcours d'une simulation garde au journal : un début, une seule
// intention, puis ses pages, ses questions et ses phases (ADR-0044). Une seed
// n'est pas un parcours de prescripteur.

import { describe, expect, it } from "vitest";
import { Journey } from "../../../front/socle/analytics/journey.entity";
import type { OpenedPage } from "../../../front/socle/analytics/page-view.entity";
import { PROVENANCE } from "./journal-de-test";

// Un parcours rattaché à un service du référentiel.
const RATTACHE = {
  ...PROVENANCE,
  establishment_id: "7",
  service_id: "42",
};

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
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

    const debut = journey.start();
    const intention = journey.selectIntent("eligibilite_seule");

    expect([debut?.sequence, intention?.sequence]).toEqual([1, 2]);
    expect(intention).toMatchObject({
      type: "intent_selected",
      intent: "eligibilite_seule",
      simulation_id: journey.simulationId,
    });
  });

  it("écrit son rattachement sur chaque événement", () => {
    const journey = new Journey({ seeded: false, provenance: RATTACHE });

    const debut = journey.start();
    const ouverture = journey.openAPage(pageDeP2("P2/prestation", ["Q2.1"]));

    for (const evenement of [debut, ...ouverture]) {
      expect(evenement).toMatchObject({
        establishment_id: "7",
        service_id: "42",
      });
    }
  });

  it("garde la première intention, pas un second choix", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    journey.selectIntent("eligibilite_seule");

    expect(journey.selectIntent("eligibilite_et_prescription")).toBeNull();
  });

  it("ouvert sur une seed, ne garde rien", () => {
    const journey = new Journey({ seeded: true, provenance: PROVENANCE });

    expect([
      journey.start(),
      journey.selectIntent("eligibilite_seule"),
      journey.close("new_simulation"),
    ]).toEqual([null, null, null]);
  });

  it("une page validée qui reste dans sa phase ne la termine pas", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    journey.openAPage(pageDeP2("P2/prestation", ["Q2.1"]));

    const validation = journey.validate({
      questions: ["Q2.1"],
      nextPart: "P2",
      changed: true,
    });

    expect(types(validation)).toEqual(["question_validated"]);
  });

  it("une page de P0 n'entre dans aucune phase, et n'en affiche aucune limite", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

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
  });

  it("la dernière page d'une phase affichée part comme sa limite, avant ses questions", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

    const ouverture = journey.openAPage({
      ...pageDeP2("P2/branche", ["Q2.13.depart"]),
      last: true,
    });

    expect(types(ouverture)).toEqual([
      "phase_entered",
      "phase_boundary_displayed",
      "question_exposed",
    ]);
    expect(ouverture[1]).toMatchObject({
      screen: "P2",
      boundary: "last",
      page_id: "P2/branche",
    });
  });

  it("une page à la fois première et dernière affiche les deux limites", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

    const ouverture = journey.openAPage({
      ...pageDeP2("P2/seule", ["Q2.1"]),
      first: true,
      last: true,
    });

    expect(
      ouverture
        .filter(({ type }) => type === "phase_boundary_displayed")
        .map(({ boundary }) => boundary),
    ).toEqual(["first", "last"]);
  });

  it("une autre page devenue la dernière affiche à son tour la limite", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    const derniere = (id: string) => ({ ...pageDeP2(id, ["Q"]), last: true });
    journey.openAPage(derniere("P2/branche"));

    const rouverte = journey.openAPage(derniere("P2/branche"));
    const suivante = journey.openAPage(derniere("P2/suite"));

    expect(types(rouverte)).toEqual(["question_exposed"]);
    expect(suivante[0]).toMatchObject({
      type: "phase_boundary_displayed",
      page_id: "P2/suite",
    });
  });
});

// Le dernier R2 d'un parcours : ce qu'il affiche, et ses codes.
const unR2 = {
  canComplete: true,
  codes: {
    issue: "ISSUE_PMT",
    mode: null,
    transportComposition: "unknown",
    reasonCodes: [],
    support: "S3138g",
  },
} as const;

// La dernière page de P2 validée, ses réponses changées ou non.
function valider(journey: Journey, changed: boolean) {
  journey.openAPage(pageDeP2("P2/prestation", ["Q2.1"]));
  return journey.validate({
    questions: ["Q2.1"],
    nextPart: null,
    changed,
  });
}

describe("les révisions du premier résultat", () => {
  it("un R2 affiché ouvre la révision r1, avec ses codes connus seulement", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

    const [affiche] = journey.displayResult(unR2);

    expect(affiche).toMatchObject({
      type: "result_displayed",
      screen: "R2",
      revision: "r1",
      can_complete: true,
      issue: "ISSUE_PMT",
      support: "S3138g",
      reason_codes: [],
      transport_composition: "unknown",
    });
    expect(affiche).not.toHaveProperty("mode");
  });

  it("un R2 part avec la composition du transport et son mode terrestre", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    const mixte = {
      ...unR2,
      codes: { ...unR2.codes, transportComposition: "mixed", mode: "TAP" },
    } as const;

    const [affiche] = journey.displayResult(mixte);

    expect(affiche).toMatchObject({
      transport_composition: "mixed",
      mode: "TAP",
    });
  });

  it("un R2 réaffiché sans modification garde sa révision, et ne repart pas", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
    journey.displayResult(unR2);

    const revalidation = valider(journey, false);

    expect(types(revalidation)).not.toContain("result_invalidated");
    expect(journey.displayResult(unR2)).toEqual([]);
  });

  it("une modification de P2 fait tomber la révision, et le R2 suivant ouvre r2", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
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
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });

    expect(types(valider(journey, true))).not.toContain("result_invalidated");
  });

  it("l'entrée en P3 porte la révision courante", () => {
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
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
    const journey = new Journey({ seeded: false, provenance: PROVENANCE });
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
      nextPart: null,
      changed: true,
    });

    expect(types(validation)).not.toContain("result_invalidated");
  });
});
