// La taille des textes imprimés d'un cerfa, par entrée de son DTO (ADR-12 de
// l'analytics) : celle où chaque texte s'imprime vraiment, jamais le texte.

import { describe, expect, it } from "vitest";
import {
  at,
  box,
  type Cerfa,
  commentOn,
  date,
  drawnBox,
  onOneLine,
  type Position,
  text,
} from "../../../front/socle/cerfa/cerfa";
import { generateCerfa } from "../../../front/socle/cerfa/generate-the-cerfa/generate-the-cerfa";
import { typographyOf } from "../../../front/socle/cerfa/generate-the-cerfa/typography";
import { statesOf, testForm } from "./test-form";

type Fiche = {
  fields: {
    nom?: string;
    motif?: string;
    precisions?: string;
    en_ald?: boolean;
    avec_lait?: boolean;
    echeance?: string;
  };
  drawings: { consigne?: string };
};

const template = testForm();

// La consigne tient sur une ligne : sur le second volet, son cadre est étroit.
async function fiche(...consigne: Position[]): Promise<Cerfa<Fiche>> {
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
      echeance: date("echeance"),
    },
    drawings: { consigne: onOneLine(at(...consigne)) },
  };
}

const LARGE = { page: 1, x: 20, y: 60, width: 300 };
const ETROIT = { page: 2, x: 20, y: 60, width: 150 };

const tailles = async (dto: Fiche, cerfa = fiche(LARGE, ETROIT)) =>
  (await generateCerfa(await cerfa, dto)).typography;

const CONSIGNE = "Sans mousse, lait à part, sucre en morceaux.";
const LONG = "Un motif médical beaucoup trop long pour ce cadre. ".repeat(4);

describe("la taille des textes imprimés d'un cerfa", () => {
  it("donne la taille de chaque texte écrit, par clé du DTO, sans les cases", async () => {
    const typographie = await tailles({
      fields: {
        nom: "Dupont",
        echeance: "2026-10-06",
        en_ald: true,
        avec_lait: true,
      },
      drawings: {},
    });

    expect(typographie).toEqual({
      sizes: { nom: 9, echeance: 9 },
      unmeasured: [],
    });
  });

  it("ne mesure pas une entrée absente ou vide", async () => {
    const typographie = await tailles({
      fields: { nom: "" },
      drawings: { consigne: "" },
    });

    expect(typographie).toEqual({ sizes: {}, unmeasured: [] });
  });

  it("mesure un commentaire avec le texte qu'il suit, dans le même champ", async () => {
    const { sizes } = await tailles({
      fields: { motif: "Dialyse.", precisions: "Fauteuil." },
      drawings: {},
    });

    expect(Object.keys(sizes)).toEqual(["motif"]);
  });

  it("donne la taille où le texte s'imprime, pas celle de départ", async () => {
    const { sizes } = await tailles({ fields: { nom: LONG }, drawings: {} });

    expect(sizes.nom).toBeLessThan(9);
  });

  it("garde, d'un texte porté par deux volets, sa plus petite taille", async () => {
    const dto = { fields: {}, drawings: { consigne: CONSIGNE } };

    const surLesDeux = await tailles(dto);
    const surLeLarge = await tailles(dto, fiche(LARGE));
    const surLEtroit = await tailles(dto, fiche(ETROIT));

    expect(surLeLarge.sizes.consigne).toBe(9);
    expect(surLEtroit.sizes.consigne).toBeLessThan(9);
    expect(surLesDeux.sizes.consigne).toBe(surLEtroit.sizes.consigne);
  });

  it("dit, une fois, quel texte imprimé n'a pas de taille, même lue sur un autre volet", () => {
    const typographie = typographyOf({
      texts: [
        ["nom", "nom"],
        ["motif", "motif"],
      ],
      fieldSizes: new Map([["motif", 8]]),
      drawn: [
        ["consigne", undefined],
        ["consigne", 7.5],
        ["consigne", undefined],
      ],
    });

    expect(typographie).toEqual({
      sizes: { motif: 8 },
      unmeasured: ["nom", "consigne"],
    });
  });
});
