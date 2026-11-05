// Où et à quelle taille se dessine un texte trop long pour son cadre (D-85,
// D-94). Un texte en arrive là s'il est plus long que le nombre de caractères
// de son champ, ou s'il ne tient pas dans son cadre au plancher de lisibilité
// et reste près du cadre une fois dessiné dessous (#341) : une adresse longue
// dans une zone d'une ligne, par exemple. Tout autre rapetisse jusqu'à tenir
// dans son cadre (D-193).
//
// Le champ reste vide. Le texte part du haut du cadre, garde sa largeur, et
// continue en dessous, quitte à passer sur ce qui s'y trouve. Il s'écrit à la
// taille réduite, ou à la plus grande taille où il reste près de son cadre, et
// ne descend plus bas que s'il sortirait de la page, jusqu'au plancher. Au
// plancher, il s'écrit quand même : le PDF n'est jamais bloqué.

import {
  breakTextIntoLines,
  type PDFDocument,
  type PDFFont,
  type PDFWidgetAnnotation,
} from "pdf-lib";
import { type Drawing, LINE_HEIGHT } from "./flatten-the-form";
import { paddingOf } from "./text-fit";
import { SIZE_STEP, TEXT_SIZES } from "./text-sizes";
import { pageOf } from "./widget-page";

/**
 * `text` dessiné sous chaque widget de son champ : un par volet, comme les
 * valeurs écrites dans le champ. À la taille `from` au plus.
 */
export function overflowsOf(
  document: PDFDocument,
  widgets: readonly PDFWidgetAnnotation[],
  font: PDFFont,
  text: string,
  from: number = TEXT_SIZES.reduced,
): Drawing[] {
  return widgets.map((widget) => {
    const page = pageOf(document, widget);
    const frame = frameOf(widget);
    const size = sizeOnPage(text, frame, font, from);
    return {
      text,
      size,
      at: {
        page: document.getPages().indexOf(page) + 1,
        x: frame.x,
        y: firstBaseline(frame, font, size),
        width: frame.width,
      },
    };
  });
}

/**
 * `text` dessiné sous chaque widget de son champ, à la plus grande taille, de
 * la taille réduite au plancher, où il reste près de chacun : en dépasse d'au
 * plus une ligne. Rien s'il s'en éloignerait même au plancher : plus bas, il
 * passerait sur la ligne suivante du formulaire (#341).
 */
export function nearOverflowsOf(
  document: PDFDocument,
  widgets: readonly PDFWidgetAnnotation[],
  font: PDFFont,
  text: string,
): Drawing[] | TooFar {
  const sizes = widgets.map((widget) => nearSize(widget, font, text));
  if (!sizes.every((size): size is number => size !== undefined))
    return undefined;
  return overflowsOf(document, widgets, font, text, Math.min(...sizes));
}

/** Même au plancher, le texte s'éloignerait de son cadre. */
type TooFar = undefined;

// ---- implémentation ----

// Le bas de la page qu'une imprimante n'imprime pas : 5 mm.
const PRINTABLE_MARGIN = 14;

// Le cadre du champ, sans sa marge intérieure : là où le texte s'écrirait.
type Frame = { x: number; top: number; width: number; height: number };

function frameOf(widget: PDFWidgetAnnotation): Frame {
  const { x, y, width, height } = widget.getRectangle();
  const padding = paddingOf(widget);
  return {
    x: x + padding,
    top: y + height - padding,
    width: width - 2 * padding,
    height: height - 2 * padding,
  };
}

// La plus grande taille, de la taille réduite au plancher, à laquelle `text`
// dessiné sous le cadre de `widget` en dépasse d'au plus une ligne.
function nearSize(
  widget: PDFWidgetAnnotation,
  font: PDFFont,
  text: string,
): number | TooFar {
  const frame = frameOf(widget);
  for (
    let size = TEXT_SIZES.reduced;
    size >= TEXT_SIZES.floor;
    size -= SIZE_STEP
  ) {
    const lineHeight = size * LINE_HEIGHT;
    const height = linesOf(text, frame, font, size).length * lineHeight;
    if (height <= frame.height + lineHeight) return size;
  }
  return undefined;
}

function sizeOnPage(
  text: string,
  frame: Frame,
  font: PDFFont,
  from: number,
): number {
  for (let size = from; size > TEXT_SIZES.floor; size -= SIZE_STEP)
    if (bottomOf(text, frame, font, size) >= PRINTABLE_MARGIN) return size;
  return TEXT_SIZES.floor;
}

// Le bas de la dernière ligne, coupée comme `page.drawText` la coupera.
function bottomOf(text: string, frame: Frame, font: PDFFont, size: number) {
  const lines = linesOf(text, frame, font, size);
  const descent = font.heightAtSize(size) - ascentOf(font, size);
  const lastBaseline =
    firstBaseline(frame, font, size) - (lines.length - 1) * size * LINE_HEIGHT;
  return lastBaseline - descent;
}

// Les lignes du texte, coupées comme `page.drawText` les coupera.
function linesOf(text: string, frame: Frame, font: PDFFont, size: number) {
  return breakTextIntoLines(text, [" "], frame.width, (line) =>
    font.widthOfTextAtSize(line, size),
  );
}

function firstBaseline(frame: Frame, font: PDFFont, size: number): number {
  return frame.top - ascentOf(font, size);
}

function ascentOf(font: PDFFont, size: number): number {
  return font.heightAtSize(size, { descender: false });
}
