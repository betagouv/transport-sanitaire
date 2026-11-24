// La mesure des textes stricts d'un gabarit : la même que celle de
// l'écriture (`strict-text.ts`), sur une copie de travail du gabarit que rien
// n'écrit.

import { PDFDocument, type PDFFont, StandardFonts } from "pdf-lib";
import { layoutOf, type StrictEntry } from "./strict-entries";
import {
  StrictLine,
  type StrictMeasure,
  type StrictMeasurer,
  StrictText,
} from "./strict-text";
import { textFieldOf } from "./write-a-text";

/** Mesure un texte destiné à ce texte strict, par son entrée du DTO. */
export type MeasureStrictText = (entry: string, text: string) => StrictMeasure;

export async function measureStrictTexts(
  template: ArrayBuffer | Uint8Array,
  entries: readonly StrictEntry[],
): Promise<MeasureStrictText> {
  const document = await PDFDocument.load(template);
  const font = await document.embedFont(StandardFonts.Helvetica);
  const measures = measurersOf(document, font, entries);
  return (entry, text) => {
    const measure = measures.get(entry);
    if (!measure) throw new Error(`« ${entry} » n'est pas un texte strict.`);
    return measure.measure(text);
  };
}

/**
 * La mesure des textes stricts dessinés de `entries` : sans champ, Helvetica
 * suffit, sans gabarit.
 */
export async function lineMeasurersOf(
  entries: readonly StrictEntry[],
): Promise<Map<string, StrictMeasurer>> {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const drawn = entries.filter(({ place }) => "width" in place);
  return measurersOf(document, font, drawn);
}

// ---- implémentation ----

// La mesure de chaque texte strict, par entrée : dans son champ de `document`,
// ou sur une ligne de sa place dessinée.
function measurersOf(
  document: PDFDocument,
  font: PDFFont,
  entries: readonly StrictEntry[],
): Map<string, StrictMeasurer> {
  return new Map(
    entries.map(({ entry, strict, place }) => {
      const layout = layoutOf(strict);
      const measurer =
        "field" in place
          ? new StrictText(textFieldOf(document, place.field), font, layout)
          : new StrictLine(font, place.width, layout.size);
      return [entry, measurer];
    }),
  );
}
