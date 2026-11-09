import { describe, expect, it } from "vitest";
import { fillCerfa } from "../../../front/socle/cerfa/generate-the-cerfa/fill-the-form";
import { readBack, testForm } from "./test-form";

// Un texte s'écrit dans la police que `pdf-lib` redessine, Helvetica : ce
// qu'elle ne sait pas écrire ne bloque jamais le PDF.

const remplir = async (...args: Parameters<typeof fillCerfa>) => {
  const filled = await fillCerfa(...args);
  return { ...filled, read: await readBack(filled.pdf) };
};

describe("un caractère que la police ne sait pas écrire", () => {
  it("s'écrit sous sa forme simple, sans bloquer le PDF", async () => {
    const { read } = await remplir(await testForm(), [
      { field: "nom", text: "Examen du 8ᵉ mois, Ionuț Popescu" },
    ]);

    expect(read).toEqual({ nom: "Examen du 8e mois, Ionut Popescu" });
  });

  it("s'écrit « ? » s'il n'a pas de forme simple", async () => {
    const { read } = await remplir(await testForm(), [
      { field: "nom", text: "Transport 🚑 urgent" },
    ]);

    expect(read).toEqual({ nom: "Transport ? urgent" });
  });

  it("laisse tels quels les accents et la ponctuation qu'elle connaît", async () => {
    const text = "Œdème — Hôpital « Saint-Éloi », 12 €";

    const { read } = await remplir(await testForm(), [{ field: "nom", text }]);

    expect(read).toEqual({ nom: text });
  });
});
