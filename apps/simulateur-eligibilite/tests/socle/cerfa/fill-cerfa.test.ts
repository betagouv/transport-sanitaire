import { describe, expect, it } from "vitest";
import { formatDateForField } from "../../../front/socle/cerfa/dates";
import { fillCerfa } from "../../../front/socle/cerfa/fill-cerfa";
import { TEXT_SIZES } from "../../../front/socle/cerfa/text-sizes";
import {
  drawnSizesOf,
  fontSizeOf,
  readBack,
  statesOf,
  testForm,
  withWidgetFontSize,
} from "./test-form";

// Le socle de remplissage d'un PDF : ce qu'un formulaire accepte, ce qu'il
// refuse, ce qui survit à une relecture. Aucun gabarit réel n'est en jeu.

const LONG = "Un motif médical beaucoup trop long pour ce cadre. ".repeat(8);

const remplir = async (...args: Parameters<typeof fillCerfa>) => {
  const filled = await fillCerfa(...args);
  return { ...filled, read: await readBack(filled.pdf) };
};

describe("fillCerfa", () => {
  it("écrit textes et cases, et les valeurs survivent à une relecture", async () => {
    const template = await testForm();
    const [state] = await statesOf(template, "ald");

    const { read } = await remplir(template, [
      { field: "nom", text: "DUPONT Marie" },
      { field: "ald", checked: state as string },
    ]);

    expect(read).toEqual({ nom: "DUPONT Marie", ald: `/${state}` });
  });

  it("écrit un texte qui tient à la taille visée par la configuration", async () => {
    const { pdf } = await fillCerfa(await testForm(), [
      { field: "nom", text: "DUPONT Marie" },
    ]);

    expect(await fontSizeOf(pdf, "nom")).toBe(TEXT_SIZES.target);
  });

  it("dessine chaque volet à la taille du champ, même si son widget en déclare une autre", async () => {
    const template = await withWidgetFontSize(await testForm(), "adresse", 14);

    const { pdf } = await fillCerfa(template, [
      {
        field: "adresse",
        text: "Clinique des Alpes, 12 avenue Victor Hugo, Grenoble",
      },
    ]);

    expect(await drawnSizesOf(pdf, "adresse")).toEqual([
      TEXT_SIZES.reduced,
      TEXT_SIZES.reduced,
    ]);
  });

  it("refuse un état d'export que la case ne sait pas rendre", async () => {
    const template = await testForm();
    await expect(
      fillCerfa(template, [{ field: "ald", checked: "OUI" }]),
    ).rejects.toThrow("ne connaît pas l'état « /OUI »");
  });

  it("refuse d'écrire un texte dans une case, et inversement", async () => {
    const template = await testForm();
    await expect(
      fillCerfa(template, [{ field: "ald", text: "oui" }]),
    ).rejects.toThrow("n'est pas un champ texte");
    await expect(
      fillCerfa(template, [{ field: "nom", checked: "Yes" }]),
    ).rejects.toThrow("n'est pas une case à cocher");
  });

  it("aplatit sur une ligne les champs qui n'en montrent qu'une", async () => {
    const { read } = await remplir(
      await testForm(),
      [{ field: "nom", text: "1 rue du Départ\n75001 Paris" }],
      { singleLineFields: ["nom"] },
    );
    expect(read).toEqual({ nom: "1 rue du Départ - 75001 Paris" });
  });
});

describe("un commentaire facultatif", () => {
  it("s'écrit à la suite du texte quand tout tient", async () => {
    const { read, withoutComment } = await remplir(await testForm(), [
      { field: "motif", text: "Dialyse.", comment: "Fauteuil." },
    ]);

    expect(read).toEqual({ motif: "Dialyse. ; Fauteuil." });
    expect(withoutComment).toEqual([]);
  });

  it("est retiré quand le texte ne tient pas avec lui, et le dit", async () => {
    const { read, withoutComment, overflows } = await remplir(
      await testForm(),
      [{ field: "motif", text: "Dialyse en centre.", comment: LONG }],
    );

    expect(read).toEqual({ motif: "Dialyse en centre." });
    expect(withoutComment).toEqual(["motif"]);
    expect(overflows).toEqual([]);
  });
});

describe("un texte trop long pour son cadre", () => {
  it("s'écrit à la taille réduite s'il n'y tient qu'à elle", async () => {
    const { pdf } = await fillCerfa(await testForm(), [
      {
        field: "nom",
        text: "Clinique des Alpes, 12 avenue Victor Hugo, Grenoble",
      },
    ]);

    expect(await fontSizeOf(pdf, "nom")).toBe(TEXT_SIZES.reduced);
  });

  it("laisse son champ vide, et se dessine sous le haut de son cadre", async () => {
    const { read, overflows } = await remplir(await testForm(), [
      { field: "nom", text: LONG },
    ]);

    expect(read).toEqual({});
    // Le widget de `nom`, élargi par `pdf-lib` de sa bordure : x = 19,5, de
    // y = 359,5 à 376,5. Le texte s'écrit à deux points du bord.
    expect(overflows).toEqual([
      {
        text: LONG,
        size: TEXT_SIZES.reduced,
        at: { page: 1, x: 21.5, y: expect.any(Number), width: 197 },
      },
    ]);
    expect(overflows[0]?.at.y).toBeLessThan(374.5);
  });

  it("perd son commentaire avant de déborder", async () => {
    const { overflows, withoutComment } = await remplir(await testForm(), [
      { field: "nom", text: LONG, comment: "Sans mousse." },
    ]);

    expect(overflows.map(({ text }) => text)).toEqual([LONG]);
    expect(withoutComment).toEqual(["nom"]);
  });

  it("se dessine sous chacun de ses volets", async () => {
    const { overflows } = await remplir(await testForm(), [
      { field: "adresse", text: LONG },
    ]);

    expect(overflows.map(({ at }) => at.page)).toEqual([1, 2]);
  });

  it("descend sous la taille réduite plutôt que de sortir de la page", async () => {
    const { overflows } = await remplir(await testForm(), [
      { field: "motif", text: LONG.repeat(3) },
    ]);

    expect(overflows[0]?.size).toBeLessThan(TEXT_SIZES.reduced);
    expect(overflows[0]?.size).toBeGreaterThan(TEXT_SIZES.floor);
  });

  it("s'écrit au plancher, même s'il sort de la page", async () => {
    const { overflows } = await remplir(await testForm(), [
      { field: "motif", text: LONG.repeat(10) },
    ]);

    expect(overflows[0]?.size).toBe(TEXT_SIZES.floor);
  });

  it("se dessine sous son cadre quand il dépasse la limite du champ", async () => {
    const { read, overflows } = await remplir(await testForm(), [
      { field: "nir", text: "26501751160051" },
    ]);

    expect(read).toEqual({});
    expect(overflows.map(({ text }) => text)).toEqual(["26501751160051"]);
  });
});

describe("date sur un champ peigné", () => {
  it("s'écrit sans séparateur sur huit cases, avec sur dix", () => {
    expect(formatDateForField("2026-10-06", 8)).toBe("06102026");
    expect(formatDateForField("2026-10-06", 10)).toBe("06/10/2026");
  });

  it("s'écrit selon les cases du champ qui la reçoit", async () => {
    const { read } = await remplir(
      await testForm(),
      [
        { field: "naissance", text: "2026-10-06" },
        { field: "echeance", text: "2026-10-06" },
      ],
      { dateFields: ["naissance", "echeance"] },
    );

    expect(read).toMatchObject({
      naissance: "06102026",
      echeance: "06/10/2026",
    });
  });

  it("rend telle quelle une valeur qui n'est pas une date ISO", () => {
    expect(formatDateForField("", 8)).toBe("");
  });
});
