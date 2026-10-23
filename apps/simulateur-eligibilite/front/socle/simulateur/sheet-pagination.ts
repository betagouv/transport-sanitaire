// La pagination de la feuille à remettre, décidée sur ses hauteurs mesurées en
// papier (sheet-measure.ts) : une A4 si elle tient, sinon deux, la seconde
// ouverte au bloc de suivi. Sur deux pages, les dessins des cartes grandissent
// dans la place que la première laisse libre. Une fonction pure, en
// millimètres : l'impression la lit, le PDF (#129) la lira de même.

import type { CSSProperties } from "react";

/** Une zone de dessin d'une carte, et le dessin qui s'y trouve. */
export type MeasuredIllustration = {
  zoneWidth: number;
  zoneHeight: number;
  /** La largeur du dessin sur sa hauteur ; sans dessin chargé, rien. */
  ratio: number | NoDrawing;
};

/** Ce que la mesure lit sur la feuille en papier, en millimètres. */
export type SheetMeasures = {
  height: number;
  /** Le bloc de suivi : son haut, depuis celui de la feuille, et sa hauteur. */
  followUp: { top: number; height: number } | NoFollowUp;
  illustrations: readonly MeasuredIllustration[];
};

/**
 * La mise en page retenue. `one-page` : rien ne se force. `two-pages` : le
 * bloc de suivi ouvre la seconde page, et la zone des dessins prend
 * `illustrationZone` millimètres. `flowing` : le bloc de suivi est plus haut
 * qu'une page, il suit les cartes sans saut et se coupe. Au-delà de deux
 * pages, la feuille est en anomalie : `pages` le dit, rien ne le corrige.
 */
export type PrintLayout =
  | { kind: "one-page"; pages: 1 }
  | { kind: "two-pages"; pages: 2; illustrationZone: number }
  | { kind: "flowing"; pages: number };

/** La feuille ne s'imprime pas : elle garde son aspect d'écran. */
export type NotPrinting = null;

/** Un dessin qui se charge encore, a échoué, ou n'existe pas. */
export type NoDrawing = undefined;

export function printLayoutOf(measures: SheetMeasures): PrintLayout {
  const { height, followUp } = measures;
  if (height <= FITS) return { kind: "one-page", pages: 1 };
  if (!followUp || followUp.height > FITS || followUp.top > FITS) {
    return { kind: "flowing", pages: Math.ceil(height / FITS) };
  }
  const free = FITS - followUp.top;
  return {
    kind: "two-pages",
    pages: 2,
    illustrationZone: grownZone(measures.illustrations, free),
  };
}

/**
 * Ce que la feuille porte pour l'imprimer, et que le CSS lit : `data-paper`
 * la passe en papier, `data-print-layout` dit les sauts, et la variable la
 * hauteur des zones de dessin.
 */
export function paperAttributes(layout: PrintLayout | NotPrinting) {
  if (layout === null) return {};
  return {
    "data-paper": "",
    "data-print-layout": layout.kind,
    "data-print-pages": layout.pages,
    style: zoneStyle(layout),
  };
}

// ---- implémentation ----

/** Une feuille sans bloc de suivi. */
type NoFollowUp = undefined;

// La hauteur utile d'une A4 aux marges des gabarits, 297 − 2 × 9 mm, moins un
// demi-millimètre de réserve contre les arrondis, comme le composant de
// l'éditeur (§9.2).
const FITS = 279 - 0.5;

// La zone grandit de toute la place libre, mais pas au-delà de la hauteur où
// le plus étroit des dessins touche les bords : passé ce point, à 90 % de la
// largeur comme de la hauteur (§8), aucun dessin ne grandirait plus. Elle ne
// rapetisse jamais, et se tient au dixième de millimètre en dessous.
function grownZone(
  illustrations: readonly MeasuredIllustration[],
  free: number,
): number {
  const base = Math.max(0, ...illustrations.map((zone) => zone.zoneHeight));
  const useful = Math.max(
    base,
    ...illustrations.map(({ zoneWidth, ratio }) =>
      ratio ? zoneWidth / ratio : 0,
    ),
  );
  return Math.floor(Math.min(base + free, useful) * 10) / 10;
}

function zoneStyle(layout: PrintLayout): CSSProperties {
  if (layout.kind !== "two-pages") return {};
  return {
    "--socle-sheet-illustration-zone": `${layout.illustrationZone}mm`,
  } as CSSProperties;
}
