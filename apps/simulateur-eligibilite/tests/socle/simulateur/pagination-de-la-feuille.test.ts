// La pagination de la feuille à remettre, décidée sur ses hauteurs en papier,
// en millimètres. Une A4 offre 278,5 mm utiles. La feuille tient sur une page,
// ou s'imprime sur deux, la seconde ouverte au bloc de suivi ; ses dessins
// grandissent alors dans la place libre de la première. Un bloc de suivi plus
// haut qu'une page se coupe, sans saut forcé.

import { describe, expect, it } from "vitest";
import {
  type MeasuredIllustration,
  pageSlicesOf,
  paperAttributes,
  printLayoutOf,
} from "../../../front/socle/simulateur/sheet-pagination";

describe("la pagination de la feuille", () => {
  it("tient sur une page quand la feuille ne passe pas 278,5 mm", () => {
    expect(printLayoutOf(feuille({ height: 278.5 }))).toEqual({
      kind: "one-page",
      pages: 1,
    });
  });

  it("ouvre la seconde page au bloc de suivi dès que la feuille dépasse", () => {
    expect(printLayoutOf(feuille({ height: 278.6 }))).toMatchObject({
      kind: "two-pages",
      pages: 2,
    });
  });

  it("agrandit les dessins jusqu'à ce que le plus étroit touche les bords", () => {
    // 60 mm de large pour un dessin en 4/3 : 45 mm de haut, pas plus.
    const layout = printLayoutOf(feuille({ followUpTop: 150 }));

    expect(layout).toMatchObject({ kind: "two-pages", illustrationZone: 45 });
  });

  it("ne les agrandit que de la place libre sous les cartes", () => {
    const layout = printLayoutOf(feuille({ followUpTop: 275 }));

    expect(layout).toMatchObject({ kind: "two-pages", illustrationZone: 40.5 });
  });

  it("ne les agrandit pas quand leurs dessins ne sont pas chargés", () => {
    const layout = printLayoutOf(
      feuille({ illustrations: [zone(undefined), zone(undefined)] }),
    );

    expect(layout).toMatchObject({ kind: "two-pages", illustrationZone: 37 });
  });

  it("ne les réduit jamais, même quand les dessins sont très larges", () => {
    const layout = printLayoutOf(feuille({ illustrations: [zone(4)] }));

    expect(layout).toMatchObject({ kind: "two-pages", illustrationZone: 37 });
  });

  it("coupe un bloc de suivi plus haut qu'une page, sans saut forcé", () => {
    const layout = printLayoutOf(
      feuille({ height: 420, followUpTop: 130, followUpHeight: 290 }),
    );

    expect(layout).toEqual({ kind: "flowing", pages: 2 });
  });

  it("compte les pages d'une feuille en anomalie, sans la réduire", () => {
    const layout = printLayoutOf(
      feuille({ height: 600, followUpTop: 130, followUpHeight: 470 }),
    );

    expect(layout).toEqual({ kind: "flowing", pages: 3 });
  });

  it("ne force pas de saut quand le bloc de suivi commence après une page", () => {
    const layout = printLayoutOf(feuille({ height: 400, followUpTop: 290 }));

    expect(layout).toEqual({ kind: "flowing", pages: 2 });
  });

  it("ne force pas de saut dans une feuille sans bloc de suivi", () => {
    const layout = printLayoutOf({
      height: 300,
      followUp: undefined,
      illustrations: [],
    });

    expect(layout).toEqual({ kind: "flowing", pages: 2 });
  });
});

describe("ce que la feuille porte pour s'imprimer", () => {
  it("rien quand elle ne s'imprime pas", () => {
    expect(paperAttributes(null)).toEqual({});
  });

  it("le papier et sa mise en page, sur une page", () => {
    expect(paperAttributes({ kind: "one-page", pages: 1 })).toEqual({
      "data-paper": "",
      "data-print-layout": "one-page",
      "data-print-pages": 1,
      style: {},
    });
  });

  it("la hauteur des zones de dessin, sur deux pages", () => {
    expect(
      paperAttributes({ kind: "two-pages", pages: 2, illustrationZone: 45 }),
    ).toMatchObject({
      "data-print-layout": "two-pages",
      style: { "--socle-sheet-illustration-zone": "45mm" },
    });
  });
});

describe("les pages du PDF de la feuille", () => {
  it("une seule, toute la feuille, quand elle tient sur une page", () => {
    const slices = pageSlicesOf(
      { kind: "one-page", pages: 1 },
      { height: 250, followUpTop: 120 },
    );

    expect(slices).toEqual([{ top: 0, height: 250 }]);
  });

  it("deux, la seconde ouverte au bloc de suivi", () => {
    const slices = pageSlicesOf(
      { kind: "two-pages", pages: 2, illustrationZone: 45 },
      { height: 330, followUpTop: 170 },
    );

    expect(slices).toEqual([
      { top: 0, height: 170 },
      { top: 170, height: 160 },
    ]);
  });

  it("des tranches d'une page utile quand le bloc de suivi se coupe", () => {
    const slices = pageSlicesOf(
      { kind: "flowing", pages: 3 },
      { height: 600, followUpTop: 130 },
    );

    expect(slices).toEqual([
      { top: 0, height: 278.5 },
      { top: 278.5, height: 278.5 },
      { top: 557, height: 43 },
    ]);
  });

  it("coupe encore une seconde page plus haute qu'une page utile", () => {
    const slices = pageSlicesOf(
      { kind: "two-pages", pages: 2, illustrationZone: 37 },
      { height: 480, followUpTop: 200 },
    );

    expect(slices).toEqual([
      { top: 0, height: 200 },
      { top: 200, height: 278.5 },
      { top: 478.5, height: 1.5 },
    ]);
  });
});

// ---- implémentation ----

type Feuille = {
  height?: number;
  followUpTop?: number;
  followUpHeight?: number;
  illustrations?: MeasuredIllustration[];
};

// Une feuille de deux pages par défaut : 300 mm, le bloc de suivi à 150 mm, et
// les trois dessins des transports dans des zones de 60 × 37 mm.
function feuille({
  height = 300,
  followUpTop = 150,
  followUpHeight = 150,
  illustrations = [zone(640 / 410), zone(640 / 480), zone(640 / 321)],
}: Feuille) {
  return {
    height,
    followUp: { top: followUpTop, height: followUpHeight },
    illustrations,
  };
}

function zone(ratio: number | undefined): MeasuredIllustration {
  return { zoneWidth: 60, zoneHeight: 37, ratio };
}
