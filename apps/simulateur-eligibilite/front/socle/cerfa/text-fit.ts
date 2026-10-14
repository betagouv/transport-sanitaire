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
import { TEXT_SIZES } from "./text-sizes";

/**
 * La taille à laquelle `text` tient dans la zone de `field` : la taille visée,
 * sinon la taille réduite. Le nombre maximal de caractères du champ compte
 * aussi. `undefined` si le texte ne tient pas dans son cadre (D-85).
 */
export function sizeInField(
  field: PDFTextField,
  font: PDFFont,
  text: string,
): number | undefined {
  const maximum = field.getMaxLength();
  if (maximum !== undefined && text.length > maximum) return undefined;
  return [TEXT_SIZES.target, TEXT_SIZES.reduced].find((fontSize) =>
    fits(field, font, fontSize, text),
  );
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

type Bounds = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

function fits(
  field: PDFTextField,
  font: PDFFont,
  fontSize: number,
  text: string,
): boolean {
  const bounds = innerBounds(field);
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) return text === "";
  if (field.isMultiline()) return fitsMultiline(text, font, fontSize, bounds);
  const options = { alignment: TextAlignment.Left, fontSize, font, bounds };
  return layoutSinglelineText(text, options).line.width <= bounds.width;
}

function innerBounds(field: PDFTextField): Bounds | undefined {
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

// `layoutMultilineText` met des secondes à couper un long texte. Un texte plus
// large que deux fois toutes les lignes du cadre bout à bout n'y tient pas : on
// le sait sans le couper.
function fitsMultiline(
  text: string,
  font: PDFFont,
  fontSize: number,
  bounds: Bounds,
): boolean {
  const lines = Math.ceil(bounds.height / fontSize);
  if (font.widthOfTextAtSize(text, fontSize) > 2 * lines * bounds.width)
    return false;
  const layout = layoutMultilineText(text, {
    alignment: TextAlignment.Left,
    fontSize,
    font,
    bounds,
  });
  const fitsHeight = layout.lines.length * layout.lineHeight <= bounds.height;
  return fitsHeight && layout.lines.every((line) => line.width <= bounds.width);
}
