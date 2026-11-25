// Aplatit un cerfa rempli : il n'y reste aucun champ.
//
// Chaque champ devient le dessin de sa valeur, sur la page. Ce qu'un champ ne
// sait pas montrer se dessine ensuite : la marque d'une case qui partage son
// champ, un texte là où le gabarit n'a pas de champ, et un texte trop long
// pour son cadre. Le PDF s'imprime tel quel, et rien ne s'y corrige plus dans
// un lecteur. Un aperçu porte en plus sa marque en travers de chaque page.

import {
  degrees,
  drawObject,
  PDFCheckBox,
  PDFDict,
  PDFDocument,
  PDFName,
  type PDFPage,
  PDFRef,
  type PDFWidgetAnnotation,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  StandardFonts,
  translate,
} from "pdf-lib";
import type { Drawing, Drawn, Flattened, Mark } from "../cerfa-pdf.types";
import { TextFitService } from "./text-fit.service";
import { WidgetPageService } from "./widget-page.service";

export class FlattenTheFormService {
  /** L'interligne d'un texte dessiné, en proportion de sa taille. */
  static readonly LINE_HEIGHT = 1.2;

  /** Le PDF rempli `pdf`, sans aucun champ, avec `drawn` dessiné par-dessus. */
  static async flatten(
    pdf: Uint8Array,
    { marks = [], drawings = [], watermark }: Drawn = {},
  ): Promise<Flattened> {
    const document = await PDFDocument.load(pdf);
    // Les marques se relèvent avant : l'aplatissement retire les cases.
    const stamps = marks.flatMap((mark) => stampsOf(document, mark));
    document.getForm().flatten();
    for (const stamp of stamps) drawStamp(stamp);
    const drawnSizes = await drawTexts(document, drawings);
    if (watermark) await drawWatermark(document, watermark);
    return { pdf: await document.save(), drawnSizes };
  }
}

// ---- implémentation ----

// L'apparence « cochée » d'une case, et où la poser.
type Stamp = { page: PDFPage; widget: PDFWidgetAnnotation; appearance: PDFRef };

// Chaque volet recopie la case : un widget par page, tous marqués. La marque
// est l'apparence cochée de la case elle-même, celle qu'un lecteur montrerait.
function stampsOf(document: PDFDocument, { field, state }: Mark): Stamp[] {
  const box = document.getForm().getField(field);
  if (!(box instanceof PDFCheckBox)) {
    throw new Error(`Le champ « ${field} » n'est pas une case à cocher.`);
  }
  const stamps = box.acroField.getWidgets().flatMap((widget) => {
    const normal = widget.getAppearances()?.normal;
    const appearance =
      normal instanceof PDFDict ? normal.get(PDFName.of(state)) : undefined;
    if (!(appearance instanceof PDFRef)) return [];
    return [
      { page: WidgetPageService.of(document, widget), widget, appearance },
    ];
  });
  if (stamps.length === 0) {
    // La case resterait vide sans rien signaler, sur un document opposable.
    throw new Error(`« ${field} » ne connaît pas l'état « /${state} ».`);
  }
  return stamps;
}

// Le même dessin que l'aplatissement de `pdf-lib` pour un widget.
function drawStamp({ page, widget, appearance }: Stamp): void {
  const name = page.node.newXObject("Mark", appearance);
  const { x, y } = widget.getRectangle();
  page.pushOperators(
    pushGraphicsState(),
    translate(x, y),
    drawObject(name),
    popGraphicsState(),
  );
}

// Dessine chaque texte, et donne la taille de chacun.
async function drawTexts(
  document: PDFDocument,
  drawings: readonly Drawing[],
): Promise<number[]> {
  if (drawings.length === 0) return [];
  const font = await document.embedFont(StandardFonts.Helvetica);
  const pages = document.getPages();
  return drawings.map(({ text, at, size: wanted, singleLine }) => {
    const page = pages[at.page - 1];
    if (!page) throw new Error(`Le gabarit n'a pas de page ${at.page}.`);
    const size = singleLine
      ? TextFitService.sizeOnOneLine(text, at.width, font, wanted)
      : wanted;
    page.drawText(text, {
      x: at.x,
      y: at.y,
      font,
      size,
      maxWidth: at.width,
      lineHeight: size * FlattenTheFormService.LINE_HEIGHT,
    });
    return size;
  });
}

// La marque, en diagonale, centrée sur chaque page, grise et transparente : ce
// qu'elle couvre reste lisible.
async function drawWatermark(document: PDFDocument, text: string) {
  const font = await document.embedFont(StandardFonts.HelveticaBold);
  const angle = Math.PI / 4;
  for (const page of document.getPages()) {
    const { width, height } = page.getSize();
    const size = Math.min(width, height) / 12;
    const half = font.widthOfTextAtSize(text, size) / 2;
    page.drawText(text, {
      x: width / 2 - half * Math.cos(angle) + (size / 3) * Math.sin(angle),
      y: height / 2 - half * Math.sin(angle) - (size / 3) * Math.cos(angle),
      size,
      font,
      rotate: degrees(45),
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.35,
    });
  }
}
