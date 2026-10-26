// Coche les cases d'un formulaire, chacune à l'état d'export attendu.

import { PDFCheckBox, PDFDict, type PDFDocument, PDFName } from "pdf-lib";

/** Une case à cocher, et l'état d'export à y écrire. */
export type Box = { readonly field: string; readonly checked: string };

/** Coche chaque case de `boxes`, ou refuse celle qui ne saurait se rendre. */
export function checkBoxes(document: PDFDocument, boxes: readonly Box[]): void {
  const form = document.getForm();
  for (const { field, checked } of boxes) check(form, field, checked);
}

// ---- implémentation ----

type Form = ReturnType<PDFDocument["getForm"]>;

/**
 * Coche en imposant l'état d'export attendu.
 *
 * `PDFCheckBox.check()` de pdf-lib retient le premier état « on » qu'il trouve.
 * Pour les radios déguisés (voir `FieldEntry`), il coche la mauvaise case une
 * fois sur deux. On écrit donc la valeur du champ, puis pour chaque widget
 * l'état qu'il sait rendre, ou `/Off`.
 */
function check(form: Form, name: string, checked: string): void {
  const field = form.getField(name);
  if (!(field instanceof PDFCheckBox)) {
    throw new Error(`Le champ « ${name} » n'est pas une case à cocher.`);
  }
  const state = PDFName.of(checked);
  const widgets = field.acroField.getWidgets();
  const capable = widgets.filter((widget) => {
    const appearances = widget.getAppearances()?.normal;
    return appearances instanceof PDFDict && appearances.has(state);
  });
  if (capable.length === 0) {
    // Aucun widget ne sait rendre cet état. La case resterait vide sans rien
    // signaler, sur un document opposable. `/Oui` et `/OUI` sont deux états.
    throw new Error(
      `« ${name} » ne connaît pas l'état « /${checked} » : la case resterait vide.`,
    );
  }

  field.acroField.dict.set(PDFName.of("V"), state);
  for (const widget of widgets) {
    const rendersIt = capable.includes(widget);
    widget.dict.set(PDFName.of("AS"), rendersIt ? state : PDFName.of("Off"));
  }
}
