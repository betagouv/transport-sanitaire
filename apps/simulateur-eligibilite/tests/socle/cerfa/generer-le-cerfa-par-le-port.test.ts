import { describe, expect, it } from "vitest";
import { CerfaFactory } from "../../../front/socle/cerfa/cerfa.factory";
import type { Cerfa } from "../../../front/socle/cerfa/cerfa.types";
import type { CerfaPdf } from "../../../front/socle/cerfa/cerfa-pdf.port";
import type { Drawn, Filled } from "../../../front/socle/cerfa/cerfa-pdf.types";
import { GenerateTheCerfa } from "../../../front/socle/cerfa/generate-the-cerfa.usecase";

const { text, strictText, box, drawnBox } = CerfaFactory;

// Le cas d'usage ne sait du PDF que son port : un faux port dit ce qu'il lui
// demande, dans quel ordre, et la règle de l'aperçu qu'il garde pour lui.

type Fiche = {
  fields: { nom?: string; motif?: string; ald?: boolean; acc?: boolean };
  drawings: Record<never, never>;
};

const GABARIT = new Uint8Array([1, 2, 3]);
const FICHE: Cerfa<Fiche> = {
  template: async () => GABARIT,
  fileName: "fiche",
  fields: {
    nom: text("nom"),
    motif: strictText("motif", "Motif du transport"),
    ald: box("ald", "Yes"),
    acc: drawnBox("acc", "lait"),
  },
  drawings: {},
};

function fauxPdf(filled: Partial<Filled> = {}) {
  const appels: string[] = [];
  const recu: { template?: unknown; drawn?: Drawn; entries?: unknown } = {};
  const pdf: CerfaPdf = {
    async lineMeasurers() {
      appels.push("lineMeasurers");
      return new Map();
    },
    async fill(template, entries) {
      appels.push("fill");
      recu.template = template;
      recu.entries = entries;
      return {
        pdf: new Uint8Array([9]),
        overflows: [],
        overflowing: [],
        sizes: new Map(),
        ...filled,
      };
    },
    async flatten(_pdf, drawn) {
      appels.push("flatten");
      recu.drawn = drawn;
      return { pdf: new Uint8Array([7]), drawnSizes: [] };
    },
    async measureStrictTexts() {
      appels.push("measureStrictTexts");
      return () => ({ fits: true, maximum: 1 });
    },
  };
  return { pdf, appels, recu };
}

describe("le cas d'usage qui génère le cerfa", () => {
  it("demande au PDF de mesurer, de remplir puis d'aplatir, dans cet ordre", async () => {
    const { pdf, appels } = fauxPdf();

    await new GenerateTheCerfa(pdf).execute(FICHE, {
      fields: { nom: "Dupont" },
      drawings: {},
    });

    expect(appels).toEqual(["lineMeasurers", "fill", "flatten"]);
  });

  it("traduit le DTO dans les noms du gabarit, et lui donne son gabarit", async () => {
    const { pdf, recu } = fauxPdf();

    await new GenerateTheCerfa(pdf).execute(FICHE, {
      fields: { nom: "Dupont", ald: true, acc: true },
      drawings: {},
    });

    expect(recu.template).toBe(GABARIT);
    expect(recu.entries).toEqual([
      { field: "nom", text: "Dupont" },
      { field: "ald", checked: "Yes" },
    ]);
    expect(recu.drawn?.marks).toEqual([
      { field: "acc", state: "lait", drawn: true },
    ]);
  });

  it("ne marque pas le PDF d'un aperçu quand rien ne déborde", async () => {
    const { pdf, recu } = fauxPdf();

    const genere = await new GenerateTheCerfa(pdf).execute(FICHE, {
      fields: { nom: "Dupont" },
      drawings: {},
    });

    expect(recu.drawn?.watermark).toBeUndefined();
    expect(genere.overflowing).toEqual([]);
  });

  it("marque le PDF d'un aperçu quand on le demande", async () => {
    const { pdf, recu } = fauxPdf();

    await new GenerateTheCerfa(pdf).execute(
      FICHE,
      { fields: { nom: "Dupont" }, drawings: {} },
      { preview: true },
    );

    expect(recu.drawn?.watermark).toBe(GenerateTheCerfa.PREVIEW_MARK);
  });

  it("marque le PDF d'un aperçu, et rend le texte, quand un texte strict déborde", async () => {
    const { pdf, recu } = fauxPdf({
      overflowing: [{ field: "motif", maximum: 12 }],
    });

    const genere = await new GenerateTheCerfa(pdf).execute(FICHE, {
      fields: { motif: "Un motif trop long" },
      drawings: {},
    });

    expect(recu.drawn?.watermark).toBe(GenerateTheCerfa.PREVIEW_MARK);
    expect(genere.overflowing).toEqual([
      {
        entry: "motif",
        label: "Motif du transport",
        text: "Un motif trop long",
        maximum: 12,
      },
    ]);
  });
});
