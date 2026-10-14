// Aplatit un cerfa rempli : il n'y reste aucun champ (D-84).
//
// Chaque champ devient le dessin de sa valeur, sur la page. Ce qu'un champ ne
// sait pas montrer se dessine ensuite : la marque d'une case qui partage son
// champ. Le PDF s'imprime tel quel, et rien ne s'y corrige plus dans un
// lecteur.

import {
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
  translate,
} from "pdf-lib";

/** Une case à marquer : son champ, et l'état d'export qui la désigne. */
export type Mark = { readonly field: string; readonly state: string };

/** Le PDF rempli `pdf`, sans aucun champ, avec `marks` dessinées par-dessus. */
export async function flattenCerfa(
  pdf: Uint8Array,
  marks: readonly Mark[] = [],
): Promise<Uint8Array> {
  const document = await PDFDocument.load(pdf);
  // Les marques se relèvent avant : l'aplatissement retire les cases.
  const stamps = marks.flatMap((mark) => stampsOf(document, mark));
  document.getForm().flatten();
  for (const stamp of stamps) drawStamp(stamp);
  return document.save();
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
    return [{ page: pageOf(document, widget), widget, appearance }];
  });
  if (stamps.length === 0) {
    // La case resterait vide sans rien signaler, sur un document opposable.
    throw new Error(`« ${field} » ne connaît pas l'état « /${state} ».`);
  }
  return stamps;
}

function pageOf(document: PDFDocument, widget: PDFWidgetAnnotation): PDFPage {
  const ref = document.context.getObjectRef(widget.dict);
  const page = document
    .getPages()
    .find(
      (candidate) =>
        candidate.ref === widget.P() ||
        (ref !== undefined &&
          (candidate.node.Annots()?.indexOf(ref) ?? -1) !== -1),
    );
  if (!page) throw new Error("Une case n'est sur aucune page.");
  return page;
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
