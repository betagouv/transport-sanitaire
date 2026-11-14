// Ce qu'une valeur lit : un objet valeur. Deux lectures se composent en une
// nouvelle, chaque chose une fois ; ce qu'une branche lit reste à part jusqu'à
// ce qu'on l'aplatisse.

import { describe, expect, it } from "vitest";
import { Reads } from "../../../core/socle/questionnaire-engine";

describe("ce qu'une valeur lit", () => {
  it("se compose, chaque chose une fois", () => {
    const lu = Reads.union(
      Reads.ofQuestion("boisson"),
      Reads.ofFait("chaude"),
      Reads.ofQuestion("boisson").with(Reads.ofCible("cible_sucre")),
    );
    expect(lu).toEqual({
      questions: ["boisson"],
      faits: ["chaude"],
      cibles: ["cible_sucre"],
    });
  });

  it("ne lit rien d'elle-même", () => {
    expect(Reads.union()).toEqual(Reads.none());
    expect(Reads.none()).toEqual({ questions: [], faits: [], cibles: [] });
  });

  it("garde à part ce qu'une branche lit, jusqu'à l'aplatir", () => {
    const fiche = Reads.ofQuestion("taille");
    const lu = Reads.onBranch("cible_issue", ["POSITIVE"], fiche);
    expect(lu.questions).toEqual([]);
    expect(lu.cibles).toEqual(["cible_issue"]);
    expect(lu.branches).toEqual([
      { cible: "cible_issue", values: ["POSITIVE"], reads: fiche },
    ]);
    expect(lu.withoutBranches().branches).toEqual([]);
    expect(lu.flattened()).toEqual({
      questions: ["taille"],
      faits: [],
      cibles: ["cible_issue"],
    });
    expect(lu.flattened().branches).toEqual([]);
  });

  it("ne change pas", () => {
    expect(Object.isFrozen(Reads.ofQuestion("boisson"))).toBe(true);
  });
});
