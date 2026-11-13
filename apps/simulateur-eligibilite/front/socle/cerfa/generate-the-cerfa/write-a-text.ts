// Écrit un texte dans son champ (D-85, D-193, #341) : chaque étape l'écrit si
// elle y arrive, sinon passe la main à la suivante. Le commentaire est la seule
// chose qui se retire.

import { type PDFDocument, type PDFFont, PDFTextField } from "pdf-lib";
import type { Drawing } from "./flatten-the-form";
import { nearOverflowsOf, overflowsOf } from "./overflow";
import { sizeInField, sizeToFit } from "./text-fit";
import { SIZE_STEP } from "./text-sizes";

/** Un texte à écrire dans un champ nommé, et son commentaire facultatif. */
export type Text = {
  readonly field: string;
  readonly text: string;
  readonly comment?: string;
};

export type WrittenText = {
  readonly overflows: readonly Drawing[];
  readonly withoutComment: boolean;
  /**
   * La taille à laquelle le texte s'imprime, en points : dans son champ, ou la
   * plus petite de ses dessins sous le cadre (ADR-12 de l'analytics).
   */
  readonly size: number | NotPrinted;
};

/** Le champ n'a aucun widget : le texte ne s'imprime nulle part. */
type NotPrinted = null;

export function writeText(
  document: PDFDocument,
  font: PDFFont,
  entry: Text,
): WrittenText {
  const field = textFieldOf(document, entry.field);
  return (
    writeWithComment(field, font, entry) ??
    writeWithoutComment(field, font, entry) ??
    writeShrunk(field, font, entry) ??
    overflowIfNear(document, field, font, entry) ??
    writeShrunk(field, font, entry, SIZE_STEP) ??
    overflow(document, field, font, entry)
  );
}

export function textFieldOf(document: PDFDocument, name: string): PDFTextField {
  const field = document.getForm().getField(name);
  if (!(field instanceof PDFTextField)) {
    throw new Error(`Le champ « ${name} » n'est pas un champ texte.`);
  }
  return field;
}

// ---- implémentation ----

/** Rien n'est écrit dans le champ : l'étape suivante essaie autrement. */
type NotWritten = undefined;

// Le texte suivi de son commentaire, s'il tient dans le cadre.
function writeWithComment(
  field: PDFTextField,
  font: PDFFont,
  { text, comment = "" }: Text,
): WrittenText | NotWritten {
  const full = [text, comment].filter((part) => part !== "").join(" ; ");
  const size = writeIfFits(field, font, full);
  if (size === undefined) return undefined;
  return { overflows: [], withoutComment: false, size };
}

// Le texte seul, son commentaire retiré, s'il tient dans le cadre.
function writeWithoutComment(
  field: PDFTextField,
  font: PDFFont,
  { text, comment }: Text,
): WrittenText | NotWritten {
  if (!comment) return undefined;
  const size = writeIfFits(field, font, text);
  if (size === undefined) return undefined;
  return { overflows: [], withoutComment: true, size };
}

// Le texte seul, à la ligne, rapetissé jusqu'à `floor` au plus (D-193, #341).
function writeShrunk(
  field: PDFTextField,
  font: PDFFont,
  { text, comment }: Text,
  floor?: number,
): WrittenText | NotWritten {
  const fontSize = sizeToFit(field, font, text, floor);
  if (fontSize === undefined) return undefined;
  field.enableMultiline();
  write(field, text, fontSize);
  return { overflows: [], withoutComment: Boolean(comment), size: fontSize };
}

// Rien dans le champ : le texte seul se dessinera sous chaque widget, s'il en
// reste près (#341).
function overflowIfNear(
  document: PDFDocument,
  field: PDFTextField,
  font: PDFFont,
  { text, comment }: Text,
): WrittenText | NotWritten {
  const widgets = field.acroField.getWidgets();
  const overflows = nearOverflowsOf(document, widgets, font, text);
  return overflows && drawn(overflows, comment);
}

// Rien dans le champ : le texte seul se dessinera sous chaque widget.
function overflow(
  document: PDFDocument,
  field: PDFTextField,
  font: PDFFont,
  { text, comment }: Text,
): WrittenText {
  const widgets = field.acroField.getWidgets();
  return drawn(overflowsOf(document, widgets, font, text), comment);
}

// Le texte dessiné sous son cadre : il s'imprime à la plus petite taille de
// ses dessins.
function drawn(
  overflows: readonly Drawing[],
  comment: string | undefined,
): WrittenText {
  const sizes = overflows.map(({ size }) => size);
  return {
    overflows,
    withoutComment: Boolean(comment),
    size: sizes.length > 0 ? Math.min(...sizes) : null,
  };
}

// Écrit `text` à la plus grande taille où il tient, s'il y en a une : donne
// cette taille.
function writeIfFits(
  field: PDFTextField,
  font: PDFFont,
  text: string,
): number | NotWritten {
  const fontSize = sizeInField(field, font, text);
  if (fontSize === undefined) return undefined;
  write(field, text, fontSize);
  return fontSize;
}

function write(field: PDFTextField, text: string, fontSize: number): void {
  field.setText(text);
  field.setFontSize(fontSize);
  sameSizeOnEveryWidget(field);
}

// Un widget à taille propre (volets 3 et 4 de la DAP) l'emporte sur celle du
// champ chez `pdf-lib` : son texte s'y dessinerait à sa taille, coupé.
function sameSizeOnEveryWidget(field: PDFTextField): void {
  const appearance = field.acroField.getDefaultAppearance();
  if (appearance === undefined) return;
  for (const widget of field.acroField.getWidgets())
    widget.setDefaultAppearance(appearance);
}
