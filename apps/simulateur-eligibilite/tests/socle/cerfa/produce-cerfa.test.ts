import { describe, expect, it } from "vitest";
import {
  at,
  box,
  type Cerfa,
  drawnBox,
  text,
} from "../../../front/socle/cerfa/cerfa";
import {
  fileNameOf,
  produceCerfa,
} from "../../../front/socle/cerfa/produce-cerfa";
import { drawnOn, markedStates, statesOf, testForm } from "./test-form";

// Le cerfa se remplit d'après son DTO, sans rien savoir du simulateur : ici,
// une simple fiche. Le DTO parle en mots clairs, la définition du cerfa garde
// les noms du gabarit.

type Fiche = {
  fields: {
    nom?: string;
    motif?: string;
    en_ald?: boolean;
    avec_lait?: boolean;
    avec_sucre?: boolean;
    avec_citron?: boolean;
  };
  drawings: { remarque?: string };
};

const template = testForm();

async function fiche(): Promise<Cerfa<Fiche>> {
  const [ald] = await statesOf(await template, "ald");
  return {
    template: () => template,
    fileName: "fiche",
    fields: {
      nom: text("nom"),
      motif: text("motif", { measured: true }),
      en_ald: box("ald", ald ?? ""),
      avec_lait: drawnBox("acc", "lait"),
      avec_sucre: drawnBox("acc", "sucre"),
      avec_citron: drawnBox("acc", "citron"),
    },
    drawings: { remarque: at({ page: 1, x: 20, y: 100, width: 300 }) },
  };
}

const produire = async (dto: Fiche) =>
  new Uint8Array(await (await produceCerfa(await fiche(), dto)).arrayBuffer());

describe("produire un cerfa", () => {
  it("le remplit d'après son DTO, puis l'aplatit", async () => {
    const pdf = await produire({
      fields: { nom: "Dupont", motif: "Dialyse" },
      drawings: {},
    });

    expect(await drawnOn(pdf)).toEqual({
      fields: 0,
      texts: expect.arrayContaining(["Dupont", "Dialyse"]),
    });
  });

  it("laisse vide une entrée absente, vide ou fausse", async () => {
    const pdf = await produire({
      fields: { nom: "", en_ald: false },
      drawings: { remarque: "" },
    });

    expect((await drawnOn(pdf)).texts).toEqual([]);
    expect(await markedStates(await template, pdf, "acc")).toEqual([]);
  });

  it("marque ensemble plusieurs cases d'un même champ", async () => {
    const pdf = await produire({
      fields: { avec_lait: true, avec_citron: true },
      drawings: {},
    });

    expect(await markedStates(await template, pdf, "acc")).toEqual([
      "lait",
      "citron",
    ]);
  });

  it("coche une case seule dans son champ", async () => {
    const pdf = await produire({ fields: { en_ald: true }, drawings: {} });

    expect(await markedStates(await template, pdf, "ald")).toEqual(
      await statesOf(await template, "ald"),
    );
  });

  it("refuse de marquer un état que la case ne connaît pas", async () => {
    const cerfa = await fiche();
    const fautive = {
      ...cerfa,
      fields: { ...cerfa.fields, avec_lait: drawnBox("acc", "Lait") },
    };

    await expect(
      produceCerfa(fautive, { fields: { avec_lait: true }, drawings: {} }),
    ).rejects.toThrow("« acc » ne connaît pas l'état « /Lait »");
  });

  it("dessine un texte là où le gabarit n'a pas de champ", async () => {
    const pdf = await produire({
      fields: {},
      drawings: { remarque: "Sans mousse." },
    });

    expect((await drawnOn(pdf)).texts).toEqual(["Sans mousse."]);
  });

  it("date le nom du fichier au jour de Paris", () => {
    // 23 h 30 à Greenwich, le 14 : il est déjà le 15 à Paris.
    expect(fileNameOf("fiche", new Date("2026-10-14T23:30:00Z"))).toBe(
      "fiche-2026-10-15.pdf",
    );
  });
});
