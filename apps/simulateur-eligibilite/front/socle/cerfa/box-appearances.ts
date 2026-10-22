// Les cases d'un gabarit gardent leur propre dessin.
//
// Un gabarit réel ne donne souvent à ses cases que l'apparence cochée, sans
// `/Off`. `pdf-lib` redessine alors toute la case à sa façon en enregistrant
// et en aplatissant : la coche du gabarit disparaît, et un second cadre
// s'ajoute au sien. Une case non cochée ne montre rien : son `/Off` vide suffit.

import { PDFCheckBox, PDFDict, type PDFDocument, PDFName } from "pdf-lib";

/** Donne un `/Off` vide à chaque case du formulaire qui n'en a pas. */
export function keepBoxAppearances(document: PDFDocument): void {
  const off = PDFName.of("Off");
  for (const field of document.getForm().getFields()) {
    if (!(field instanceof PDFCheckBox)) continue;
    for (const widget of field.acroField.getWidgets()) {
      const normal = widget.getAppearances()?.normal;
      if (!(normal instanceof PDFDict) || normal.has(off)) continue;
      const { width, height } = widget.getRectangle();
      const empty = document.context.formXObject([], {
        BBox: [0, 0, width, height],
      });
      normal.set(off, document.context.register(empty));
    }
  }
}
