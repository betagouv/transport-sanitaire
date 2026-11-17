// Écrit un texte dans son champ (D-85, D-193, #341) : chaque étape l'écrit si
// elle y arrive, sinon passe la main à la suivante. Un texte strict n'a pas ces
// étapes (D-302) : il s'écrit à sa taille, ou pas (`strict-text.ts`).

import { type PDFDocument, type PDFFont, PDFTextField } from "pdf-lib";
import type { Drawing } from "./flatten-the-form";
import { nearOverflowsOf, overflowsOf } from "./overflow";
import type { StrictLayout } from "./strict-text";
import { sizeInField, sizeToFit } from "./text-fit";
import { SIZE_STEP } from "./text-sizes";

/** Un texte à écrire dans un champ nommé. `strict` : à sa taille ou pas. */
export type Text = {
  readonly field: string;
  readonly text: string;
  readonly strict?: StrictLayout;
};

export type WrittenText = {
  readonly overflows: readonly Drawing[];
  /**
   * La taille à laquelle le texte s'imprime, en points : dans son champ, ou la
   * plus petite de ses dessins sous le cadre (ADR-0048).
   */
  readonly size: number | NotPrinted;
};

/** Le champ n'a aucun widget : le texte ne s'imprime nulle part. */
type NotPrinted = null;

export function writeText(
  document: PDFDocument,
  font: PDFFont,
  { field: name, text }: Text,
): WrittenText {
  const field = textFieldOf(document, name);
  return (
    writeIfFits(field, font, text) ??
    writeShrunk(field, font, text) ??
    overflowIfNear(document, field, font, text) ??
    writeShrunk(field, font, text, SIZE_STEP) ??
    overflow(document, field, font, text)
  );
}

export function textFieldOf(document: PDFDocument, name: string): PDFTextField {
  const field = document.getForm().getField(name);
  if (!(field instanceof PDFTextField)) {
    throw new Error(`Le champ « ${name} » n'est pas un champ texte.`);
  }
  return field;
}

/** Écrit `text` dans `field` à `fontSize`, sur chacun de ses widgets. */
export function write(
  field: PDFTextField,
  text: string,
  fontSize: number,
): void {
  field.setText(text);
  field.setFontSize(fontSize);
  sameSizeOnEveryWidget(field);
}

// ---- implémentation ----

/** Rien n'est écrit dans le champ : l'étape suivante essaie autrement. */
type NotWritten = undefined;

// Le texte à la taille visée, puis réduite, s'il tient dans le cadre.
function writeIfFits(
  field: PDFTextField,
  font: PDFFont,
  text: string,
): WrittenText | NotWritten {
  const size = sizeInField(field, font, text);
  if (size === undefined) return undefined;
  write(field, text, size);
  return { overflows: [], size };
}

// Le texte, à la ligne, rapetissé jusqu'à `floor` au plus (D-193, #341).
function writeShrunk(
  field: PDFTextField,
  font: PDFFont,
  text: string,
  floor?: number,
): WrittenText | NotWritten {
  const size = sizeToFit(field, font, text, floor);
  if (size === undefined) return undefined;
  field.enableMultiline();
  write(field, text, size);
  return { overflows: [], size };
}

// Rien dans le champ : le texte se dessinera sous chaque widget, s'il en reste
// près (#341).
function overflowIfNear(
  document: PDFDocument,
  field: PDFTextField,
  font: PDFFont,
  text: string,
): WrittenText | NotWritten {
  const widgets = field.acroField.getWidgets();
  const overflows = nearOverflowsOf(document, widgets, font, text);
  return overflows && drawn(overflows);
}

// Rien dans le champ : le texte se dessinera sous chaque widget.
function overflow(
  document: PDFDocument,
  field: PDFTextField,
  font: PDFFont,
  text: string,
): WrittenText {
  const widgets = field.acroField.getWidgets();
  return drawn(overflowsOf(document, widgets, font, text));
}

// Le texte dessiné sous son cadre : il s'imprime à la plus petite taille de
// ses dessins.
function drawn(overflows: readonly Drawing[]): WrittenText {
  const sizes = overflows.map(({ size }) => size);
  return { overflows, size: sizes.length > 0 ? Math.min(...sizes) : null };
}

// Un widget à taille propre (volets 3 et 4 de la DAP) l'emporte sur celle du
// champ chez `pdf-lib` : son texte s'y dessinerait à sa taille, coupé.
function sameSizeOnEveryWidget(field: PDFTextField): void {
  const appearance = field.acroField.getDefaultAppearance();
  if (appearance === undefined) return;
  for (const widget of field.acroField.getWidgets())
    widget.setDefaultAppearance(appearance);
}
