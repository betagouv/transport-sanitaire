import { describe, expect, it } from "vitest";
import { textFrom } from "../../../front/socle/cerfa/field-mapping";
import {
  fileNameOf,
  produceCerfa,
} from "../../../front/socle/cerfa/produce-cerfa";
import { drawnOn, testForm } from "./test-form";

// Le cerfa se remplit d'après ce qu'on lui donne, sans rien savoir du
// simulateur : ici, une simple fiche.

type Fiche = { nom: string; motif: string };

const formulaire = {
  template: testForm,
  fileName: "fiche",
  mapping: {
    nom: textFrom(({ nom }: Fiche) => nom),
    motif: textFrom(({ motif }: Fiche) => motif),
  },
};

describe("produire un cerfa", () => {
  it("le remplit d'après une source quelconque, puis l'aplatit", async () => {
    const pdf = await produceCerfa(formulaire, {
      nom: "Dupont",
      motif: "Dialyse",
    });

    expect(await drawnOn(new Uint8Array(await pdf.arrayBuffer()))).toEqual({
      fields: 0,
      texts: expect.arrayContaining(["Dupont", "Dialyse"]),
    });
    expect(pdf.type).toBe("application/pdf");
  });

  it("date le nom du fichier au jour de Paris", () => {
    // 23 h 30 à Greenwich, le 14 : il est déjà le 15 à Paris.
    expect(fileNameOf("fiche", new Date("2026-10-14T23:30:00Z"))).toBe(
      "fiche-2026-10-15.pdf",
    );
  });
});
