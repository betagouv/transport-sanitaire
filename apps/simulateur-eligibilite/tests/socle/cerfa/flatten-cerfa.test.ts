import { describe, expect, it } from "vitest";
import { fillCerfa } from "../../../front/socle/cerfa/generate-the-cerfa/fill-the-form";
import { flattenCerfa } from "../../../front/socle/cerfa/generate-the-cerfa/flatten-the-form";
import { drawnOn, markedStates } from "./pdf-aplati";
import { testForm, withoutOffAppearance } from "./test-form";

// Le cerfa de sortie est aplati (D-84) : ses valeurs sont dessinées sur la
// page, et il n'y reste aucun champ à corriger dans un lecteur.

describe("flattenCerfa", () => {
  it("ne laisse aucun champ, et garde chaque valeur écrite", async () => {
    const filled = await fillCerfa(await testForm(), [
      { field: "nom", text: "DUPONT Marie" },
      { field: "motif", text: "Dialyse en centre." },
    ]);

    const pdf = await flattenCerfa(filled.pdf);

    expect(await drawnOn(pdf)).toEqual({
      fields: 0,
      texts: expect.arrayContaining(["DUPONT Marie", "Dialyse en centre."]),
    });
  });

  it("dessine une case cochée de l'apparence de son gabarit, même sans état « Off »", async () => {
    const template = await withoutOffAppearance(await testForm(), "acc");
    const filled = await fillCerfa(template, [
      { field: "acc", checked: "sucre" },
    ]);

    const pdf = await flattenCerfa(filled.pdf);

    expect(await markedStates(template, pdf, "acc")).toEqual(["sucre"]);
  });
});
