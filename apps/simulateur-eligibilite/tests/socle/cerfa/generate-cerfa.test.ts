import { describe, expect, it } from "vitest";
import {
  at,
  box,
  type Cerfa,
  commentOn,
  date,
  drawnBox,
  onOneLine,
  text,
} from "../../../front/socle/cerfa/cerfa";
import {
  fileNameOf,
  generateCerfa,
} from "../../../front/socle/cerfa/generate-cerfa";
import {
  drawnOn,
  markedStates,
  statesOf,
  testForm,
  textsOn,
} from "./test-form";

// Le cerfa se remplit d'après son DTO, sans rien savoir du simulateur : ici,
// une simple fiche. Le DTO parle en mots clairs, la définition du cerfa garde
// les noms du gabarit.

type Fiche = {
  fields: {
    nom?: string;
    motif?: string;
    precisions?: string;
    en_ald?: boolean;
    avec_lait?: boolean;
    avec_sucre?: boolean;
    avec_citron?: boolean;
    echeance?: string;
  };
  drawings: { remarque?: string; consigne?: string };
};

const template = testForm();

async function fiche(): Promise<Cerfa<Fiche>> {
  const [ald] = await statesOf(await template, "ald");
  return {
    template: () => template,
    fileName: "fiche",
    fields: {
      nom: text("nom"),
      motif: text("motif"),
      precisions: commentOn("motif"),
      en_ald: box("ald", ald ?? ""),
      avec_lait: drawnBox("acc", "lait"),
      avec_sucre: drawnBox("acc", "sucre"),
      avec_citron: drawnBox("acc", "citron"),
      echeance: date("echeance"),
    },
    drawings: {
      remarque: at(
        { page: 1, x: 20, y: 100, width: 300 },
        { page: 2, x: 20, y: 100, width: 300 },
      ),
      consigne: onOneLine(at({ page: 1, x: 20, y: 60, width: 170 })),
    },
  };
}

const generer = async (dto: Fiche) =>
  new Uint8Array(
    await (await generateCerfa(await fiche(), dto)).pdf.arrayBuffer(),
  );

const LONG = "Un motif médical beaucoup trop long pour ce cadre. ".repeat(4);

describe("générer un cerfa", () => {
  it("le remplit d'après son DTO, puis l'aplatit", async () => {
    const pdf = await generer({
      fields: { nom: "Dupont", motif: "Dialyse" },
      drawings: {},
    });

    expect(await drawnOn(pdf)).toEqual({
      fields: 0,
      texts: expect.arrayContaining(["Dupont", "Dialyse"]),
    });
  });

  it("laisse vide une entrée absente, vide ou fausse", async () => {
    const pdf = await generer({
      fields: { nom: "", en_ald: false },
      drawings: { remarque: "" },
    });

    expect((await drawnOn(pdf)).texts).toEqual([]);
    expect(await markedStates(await template, pdf, "acc")).toEqual([]);
  });

  it("marque ensemble plusieurs cases d'un même champ", async () => {
    const pdf = await generer({
      fields: { avec_lait: true, avec_citron: true },
      drawings: {},
    });

    expect(await markedStates(await template, pdf, "acc")).toEqual([
      "lait",
      "citron",
    ]);
  });

  it("coche une case seule dans son champ", async () => {
    const pdf = await generer({ fields: { en_ald: true }, drawings: {} });

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
      generateCerfa(fautive, { fields: { avec_lait: true }, drawings: {} }),
    ).rejects.toThrow("« acc » ne connaît pas l'état « /Lait »");
  });

  it("écrit une date au format de son champ", async () => {
    const pdf = await generer({
      fields: { echeance: "2026-10-06" },
      drawings: {},
    });

    expect((await drawnOn(pdf)).texts).toEqual(["06/10/2026"]);
  });

  it("dessine un texte là où le gabarit n'a pas de champ", async () => {
    const pdf = await generer({
      fields: {},
      drawings: { remarque: "Sans mousse." },
    });

    expect(await textsOn(pdf, 1)).toEqual(["Sans mousse."]);
  });

  it("dessine ce texte sur chaque volet qui le porte", async () => {
    const pdf = await generer({
      fields: {},
      drawings: { remarque: "Sans mousse." },
    });

    expect(await textsOn(pdf, 2)).toEqual(["Sans mousse."]);
  });

  it("garde sur une ligne, en rapetissant, le texte qui doit y tenir", async () => {
    const consigne = "Sans mousse, lait à part, sucre en morceaux, citron.";

    const pdf = await generer({ fields: {}, drawings: { consigne } });

    expect(await textsOn(pdf, 1)).toEqual([consigne]);
  });

  it("passe à la ligne au plancher, plutôt que de rien couper", async () => {
    const consigne =
      "Sans mousse, lait à part, sucre en morceaux, citron. ".repeat(2);

    const pdf = await generer({ fields: {}, drawings: { consigne } });

    const lignes = await textsOn(pdf, 1);
    expect(lignes.length).toBeGreaterThan(1);
    expect(lignes.map((ligne) => ligne.trim()).join(" ")).toBe(consigne.trim());
  });

  it("écrit le commentaire à la suite du texte qu'il suit", async () => {
    const pdf = await generer({
      fields: { motif: "Dialyse.", precisions: "Fauteuil." },
      drawings: {},
    });

    expect((await drawnOn(pdf)).texts).toEqual(["Dialyse. ; Fauteuil."]);
  });

  it("retire le commentaire qui ne tient pas, et dit lequel", async () => {
    const genere = await generateCerfa(await fiche(), {
      fields: { motif: "Dialyse.", precisions: LONG },
      drawings: {},
    });

    expect(genere.removedComments).toEqual(["precisions"]);
  });

  it("écrit en entier, sur plusieurs lignes de son cadre, un texte qui n'y tient pas", async () => {
    const pdf = await generer({ fields: { nom: LONG }, drawings: {} });

    const { fields, texts } = await drawnOn(pdf);
    expect(fields).toBe(0);
    expect(texts.length).toBeGreaterThan(1);
    expect(texts.map((line) => line.trim()).join(" ")).toBe(LONG.trim());
  });

  it("refuse un commentaire qui ne suit aucun texte du cerfa", async () => {
    const cerfa = await fiche();
    const fautive = {
      ...cerfa,
      fields: { ...cerfa.fields, precisions: commentOn("en_ald") },
    };

    await expect(
      generateCerfa(fautive, { fields: { precisions: "?" }, drawings: {} }),
    ).rejects.toThrow(
      "« precisions » commente « en_ald », qui n'est pas un texte du cerfa.",
    );
  });

  it("date le nom du fichier au jour de Paris", () => {
    // 23 h 30 à Greenwich, le 14 : il est déjà le 15 à Paris.
    expect(fileNameOf("fiche", new Date("2026-10-14T23:30:00Z"))).toBe(
      "fiche-2026-10-15.pdf",
    );
  });
});
