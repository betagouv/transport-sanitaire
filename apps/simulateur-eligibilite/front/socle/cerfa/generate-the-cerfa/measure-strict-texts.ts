// La mesure des textes stricts d'un gabarit (D-302), pour l'éditeur de
// l'écran : la même que celle de l'écriture (`strict-text.ts`), sur une copie
// de travail du gabarit que rien n'écrit.

import { PDFDocument, StandardFonts } from "pdf-lib";
import { type StrictMeasure, StrictText } from "./strict-text";
import { textFieldOf } from "./write-a-text";

/** Mesure un texte destiné à ce champ strict du gabarit. */
export type MeasureStrictText = (field: string, text: string) => StrictMeasure;

export async function measureStrictTexts(
  template: ArrayBuffer | Uint8Array,
  fields: readonly string[],
): Promise<MeasureStrictText> {
  const document = await PDFDocument.load(template);
  const font = await document.embedFont(StandardFonts.Helvetica);
  const measures = new Map(
    fields.map((field) => [
      field,
      new StrictText(textFieldOf(document, field), font),
    ]),
  );
  return (field, text) => {
    const measure = measures.get(field);
    if (!measure) throw new Error(`« ${field} » n'est pas un texte strict.`);
    return measure.measure(text);
  };
}
