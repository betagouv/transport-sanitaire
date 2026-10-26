// Où et à quelle taille se dessine un texte trop long pour son cadre (D-85,
// D-94).
//
// Le champ reste vide. Le texte part du haut du cadre, garde sa largeur, et
// continue en dessous, quitte à passer sur ce qui s'y trouve. Il s'écrit à la
// taille réduite, et ne descend plus bas que s'il sortirait de la page, jusqu'au
// plancher. Au plancher, il s'écrit quand même : le PDF n'est jamais bloqué.

import {
  breakTextIntoLines,
  type PDFDocument,
  type PDFFont,
  type PDFWidgetAnnotation,
} from "pdf-lib";
import { type Drawing, LINE_HEIGHT } from "./flatten-cerfa";
import { paddingOf } from "./text-fit";
import { SIZE_STEP, TEXT_SIZES } from "./text-sizes";
import { pageOf } from "./widget-page";

/**
 * `text` dessiné sous chaque widget de son champ : un par volet, comme les
 * valeurs écrites dans le champ.
 */
export function overflowsOf(
  document: PDFDocument,
  widgets: readonly PDFWidgetAnnotation[],
  font: PDFFont,
  text: string,
): Drawing[] {
  return widgets.map((widget) => {
    const page = pageOf(document, widget);
    const frame = frameOf(widget);
    const size = sizeOnPage(text, frame, font);
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

// ---- implémentation ----

// Le bas de la page qu'une imprimante n'imprime pas : 5 mm.
const PRINTABLE_MARGIN = 14;

// Le cadre du champ, sans sa marge intérieure : là où le texte s'écrirait.
type Frame = { x: number; top: number; width: number };

function frameOf(widget: PDFWidgetAnnotation): Frame {
  const { x, y, width, height } = widget.getRectangle();
  const padding = paddingOf(widget);
  return {
    x: x + padding,
    top: y + height - padding,
    width: width - 2 * padding,
  };
}

function sizeOnPage(text: string, frame: Frame, font: PDFFont): number {
  for (
    let size = TEXT_SIZES.reduced;
    size > TEXT_SIZES.floor;
    size -= SIZE_STEP
  )
    if (bottomOf(text, frame, font, size) >= PRINTABLE_MARGIN) return size;
  return TEXT_SIZES.floor;
}

// Le bas de la dernière ligne, coupée comme `page.drawText` la coupera.
function bottomOf(text: string, frame: Frame, font: PDFFont, size: number) {
  const lines = breakTextIntoLines(text, [" "], frame.width, (line) =>
    font.widthOfTextAtSize(line, size),
  );
  const descent = font.heightAtSize(size) - ascentOf(font, size);
  const lastBaseline =
    firstBaseline(frame, font, size) - (lines.length - 1) * size * LINE_HEIGHT;
  return lastBaseline - descent;
}

function firstBaseline(frame: Frame, font: PDFFont, size: number): number {
  return frame.top - ascentOf(font, size);
}

function ascentOf(font: PDFFont, size: number): number {
  return font.heightAtSize(size, { descender: false });
}
