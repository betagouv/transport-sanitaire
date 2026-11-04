// Mesure un champ du PDF : un texte y tient-il, et à quelle taille ?
//
// La mesure emploie les fonctions de `pdf-lib` qui font le rendu. Mesure et
// rendu s'accordent donc toujours.

import {
  layoutMultilineText,
  layoutSinglelineText,
  type PDFFont,
  type PDFTextField,
  type PDFWidgetAnnotation,
  TextAlignment,
} from "pdf-lib";
import { SIZE_STEP, TEXT_SIZES } from "./text-sizes";

/** Le texte ne tient dans son cadre à aucune taille. */
type DoesNotFit = undefined;

/**
 * La taille à laquelle `text` tient dans la zone de `field` : la taille visée,
 * sinon la taille réduite. Le nombre maximal de caractères du champ compte
 * aussi (D-85).
 */
export function sizeInField(
  field: PDFTextField,
  font: PDFFont,
  text: string,
): number | DoesNotFit {
  if (exceedsMaxLength(field, text)) return undefined;
  return [TEXT_SIZES.target, TEXT_SIZES.reduced].find((fontSize) =>
    fits(field, font, fontSize, text),
  );
}

/**
 * La plus grande taille, sous la taille réduite et par pas d'un demi-point, à
 * laquelle `text` tient dans la zone de `field` en passant à la ligne (D-193).
 * Aucune si le texte dépasse le nombre maximal de caractères du champ, ou si le
 * champ n'a pas de cadre.
 */
export function sizeToFit(
  field: PDFTextField,
  font: PDFFont,
  text: string,
): number | DoesNotFit {
  const bounds = innerBounds(field);
  if (exceedsMaxLength(field, text) || !hasArea(bounds)) return undefined;
  for (let size = TEXT_SIZES.reduced - SIZE_STEP; size > 0; size -= SIZE_STEP)
    if (fitsMultiline(text, font, size, bounds)) return size;
  return undefined;
}

/**
 * La plus grande taille, de `wanted` au plancher par pas d'un demi-point, à
 * laquelle `text` tient sur une ligne de `width`. Au plancher, il passera à la
 * ligne : il s'écrit quand même.
 */
export function sizeOnOneLine(
  text: string,
  width: number,
  font: PDFFont,
  wanted: number,
): number {
  for (let size = wanted; size > TEXT_SIZES.floor; size -= SIZE_STEP)
    if (font.widthOfTextAtSize(text, size) <= width) return size;
  return TEXT_SIZES.floor;
}

/**
 * La marge intérieure d'un widget : sa bordure plus un point, jamais 0, sinon
 * le texte toucherait le cadre. Le même calcul que
 * `defaultTextFieldAppearanceProvider` de `pdf-lib`.
 */
export function paddingOf(widget: PDFWidgetAnnotation): number {
  return (widget.getBorderStyle()?.getWidth() ?? 0) + 1;
}

// ---- implémentation ----

// L'interligne de `layoutMultilineText`, en proportion de la hauteur du texte.
const PDF_LIB_LINE_HEIGHT = 1.2;

type Bounds = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

function exceedsMaxLength(field: PDFTextField, text: string): boolean {
  const maximum = field.getMaxLength();
  return maximum !== undefined && text.length > maximum;
}

function hasArea(bounds: Bounds | NoWidget): bounds is Bounds {
  return bounds !== undefined && bounds.width > 0 && bounds.height > 0;
}

function fits(
  field: PDFTextField,
  font: PDFFont,
  fontSize: number,
  text: string,
): boolean {
  const bounds = innerBounds(field);
  if (!hasArea(bounds)) return text === "";
  if (field.isMultiline()) return fitsMultiline(text, font, fontSize, bounds);
  const options = { alignment: TextAlignment.Left, fontSize, font, bounds };
  return layoutSinglelineText(text, options).line.width <= bounds.width;
}

/** Le champ n'a pas de cadre sur la page. */
type NoWidget = undefined;

function innerBounds(field: PDFTextField): Bounds | NoWidget {
  const widget = field.acroField.getWidgets()[0];
  if (!widget) return undefined;
  const rectangle = widget.getRectangle();
  const padding = paddingOf(widget);
  return {
    x: 0,
    y: 0,
    width: rectangle.width - 2 * padding,
    height: rectangle.height - 2 * padding,
  };
}

// `layoutMultilineText` met des secondes à couper un long texte. Les lignes du
// cadre bout à bout, chacune avec l'espace où le texte se coupe, sont la plus
// grande largeur qu'il peut occuper : plus large, il n'y tient pas, on le sait
// sans le couper.
function fitsMultiline(
  text: string,
  font: PDFFont,
  fontSize: number,
  bounds: Bounds,
): boolean {
  const lineHeight = font.heightAtSize(fontSize) * PDF_LIB_LINE_HEIGHT;
  const lines = Math.floor(bounds.height / lineHeight);
  const room = lines * (bounds.width + font.widthOfTextAtSize(" ", fontSize));
  if (font.widthOfTextAtSize(text, fontSize) > room) return false;
  const layout = layoutMultilineText(text, {
    alignment: TextAlignment.Left,
    fontSize,
    font,
    bounds,
  });
  const fitsHeight = layout.lines.length * layout.lineHeight <= bounds.height;
  return fitsHeight && layout.lines.every((line) => line.width <= bounds.width);
}
