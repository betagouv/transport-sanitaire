import { describe, expect, it } from "vitest";
import { optionsFrom } from "../../../front/socle/questionnaire-engine/option";

// Un modèle peut déclarer ses libellés à part, en table, et en tirer ses
// options. Le socle garde l'ordre de la table, et refuse ce qui le changerait.

const LIBELLES = {
  "1_SEUL": "Seul",
  "2_AVEC_UN_PROCHE": "Avec un proche",
};

describe("des options tirées d'une table de libellés", () => {
  it("suivent l'ordre de la table, chaque clé pour valeur", () => {
    expect(optionsFrom(LIBELLES)).toEqual([
      { value: "1_SEUL", label: "Seul" },
      { value: "2_AVEC_UN_PROCHE", label: "Avec un proche" },
    ]);
  });

  it("portent ce que les détails leur ajoutent, par leur clé", () => {
    const [seul, proche] = optionsFrom(LIBELLES, {
      "2_AVEC_UN_PROCHE": { description: "Sans professionnel." },
    });
    expect(seul).toEqual({ value: "1_SEUL", label: "Seul" });
    expect(proche?.description).toBe("Sans professionnel.");
  });

  it("refusent une clé qui a l'air d'un entier", () => {
    expect(() => optionsFrom({ b: "B", 2: "Deux" })).toThrow(
      "« 2 » a l'air d'un entier",
    );
  });
});
