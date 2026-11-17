// Les textes qu'un prescripteur réécrit sur le cerfa (D-303) : la simulation
// les garde d'une transition à l'autre, et une nouvelle simulation repart
// sans.

import { describe, expect, it } from "vitest";
import { Simulation, TextEdits } from "../../../core/socle/simulation";
import { modeleDeTest } from "../modele-de-test";

const core = modeleDeTest.core;
const JOUR = new Date("2026-11-17");

// Le cerfa du modèle de test, atteint par ses réponses.
const surLeCerfa = () =>
  Simulation.resume(
    core,
    { boisson: "the", accompagnements: ["lait"], quantite: 2 },
    JOUR,
  );

describe("un texte réécrit", () => {
  it("garde son brouillon, puis le texte validé, sans le brouillon", () => {
    const brouillon = TextEdits.none().draft("motif", "Bilan");
    const valide = brouillon.accept("motif");

    expect(brouillon.drafts).toEqual({ motif: "Bilan" });
    expect(brouillon.accepted).toEqual({});
    expect(valide.drafts).toEqual({});
    expect(valide.accepted).toEqual({ motif: "Bilan" });
  });

  it("garde un texte vidé, validé tel quel", () => {
    const edits = TextEdits.none().draft("motif", "").accept("motif");

    expect(edits.accepted).toEqual({ motif: "" });
  });

  it("change seulement les retours CRLF en LF", () => {
    const edits = TextEdits.none().draft("motif", " Bilan\r\n\r\nsuivi  ");

    expect(edits.drafts.motif).toBe(" Bilan\n\nsuivi  ");
  });
});

describe("la simulation qui porte des textes réécrits", () => {
  const edits = TextEdits.none().draft("motif", "Bilan").accept("motif");

  it("les garde en revenant au complément, puis au cerfa", () => {
    const cerfa = surLeCerfa().withEdits(edits);
    const retour = cerfa.reopen().validate({ quantite: 3 }, JOUR);

    expect(cerfa.reopen().edits).toBe(edits);
    expect(retour.stage.name).toBe("cerfa");
    expect(retour.edits).toBe(edits);
  });

  it("n'en a aucun dans une nouvelle simulation", () => {
    expect(Simulation.start(core).edits).toEqual(TextEdits.none());
  });
});
