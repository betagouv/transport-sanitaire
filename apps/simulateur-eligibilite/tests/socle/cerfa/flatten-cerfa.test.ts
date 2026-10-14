import { describe, expect, it } from "vitest";
import { fillCerfa } from "../../../front/socle/cerfa/fill-cerfa";
import { flattenCerfa } from "../../../front/socle/cerfa/flatten-cerfa";
import { drawnOn, testForm } from "./test-form";

// Le cerfa de sortie est aplati (D-84) : ses valeurs sont dessinées sur la
// page, et il n'y reste aucun champ à corriger dans un lecteur.

describe("flattenCerfa", () => {
  it("ne laisse aucun champ, et garde chaque valeur écrite", async () => {
    const filled = await fillCerfa(await testForm(), [
      { field: "nom", text: "DUPONT Marie" },
      { field: "motif", measuredText: "Dialyse en centre." },
    ]);

    const pdf = await flattenCerfa(filled);

    expect(await drawnOn(pdf)).toEqual({
      fields: 0,
      texts: expect.arrayContaining(["DUPONT Marie", "Dialyse en centre."]),
    });
  });
});
