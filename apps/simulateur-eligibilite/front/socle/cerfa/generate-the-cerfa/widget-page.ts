// La page où se trouve le widget d'un champ.

import type { PDFDocument, PDFPage, PDFWidgetAnnotation } from "pdf-lib";

/**
 * La page qui porte `widget`. Un gabarit ne renseigne pas toujours la page du
 * widget (`/P`) : on la cherche aussi parmi les annotations de chaque page.
 */
export function pageOf(
  document: PDFDocument,
  widget: PDFWidgetAnnotation,
): PDFPage {
  const ref = document.context.getObjectRef(widget.dict);
  const page = document
    .getPages()
    .find(
      (candidate) =>
        candidate.ref === widget.P() ||
        (ref !== undefined &&
          (candidate.node.Annots()?.indexOf(ref) ?? -1) !== -1),
    );
  if (!page) throw new Error("Un champ n'est sur aucune page.");
  return page;
}
