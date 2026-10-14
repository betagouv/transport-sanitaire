// Remplit un formulaire PDF (AcroForm) à partir d'entrées.
//
// Ce fichier ne fait que l'écriture. Ce qu'il faut écrire se décide d'après le
// DTO du cerfa (`generate-cerfa.ts`).
//
// Il n'importe rien de `node:*` : le PDF se génère dans le navigateur, et les
// données du patient ne quittent pas le poste.

import {
  PDFCheckBox,
  PDFDict,
  PDFDocument,
  type PDFFont,
  PDFName,
  PDFTextField,
  StandardFonts,
} from "pdf-lib";
import type { Drawing } from "./flatten-cerfa";
import { overflowsOf } from "./overflow";
import { sizeInField } from "./text-fit";

/**
 * Une valeur à écrire : un texte dans un champ nommé, ou une case à cocher.
 *
 * Un texte peut porter un commentaire facultatif, écrit à sa suite. C'est la
 * seule chose qui se retire quand le texte ne tient pas dans son cadre (D-85).
 *
 * `checked` porte l'état d'export à écrire, souvent `On` ou `Yes`. Un gabarit
 * peut aussi mettre plusieurs cases sous un même nom : des boutons radio
 * déguisés, dont chaque widget rend un seul état. La casse compte : un gabarit
 * écrit `/OUI`, un autre `/Oui`. Les états se relèvent en inspectant le
 * gabarit, ils ne se devinent pas.
 */
export type FieldEntry = { readonly field: string } & (
  | { readonly text: string; readonly comment?: string }
  | { readonly checked: string }
);

export type FillOptions = {
  /**
   * Champs déclarés multilignes dans le PDF, mais dont le cadre ne montre qu'une
   * ligne. Un `\n` y ferait disparaître la suite à l'impression : leurs valeurs
   * sont aplaties sur une ligne.
   */
  readonly singleLineFields?: readonly string[];
};

/** Le PDF rempli, et ce que les champs n'ont pas pu recevoir. */
export type Filled = {
  readonly pdf: Uint8Array;
  /** Les textes trop longs pour leur cadre, à dessiner après l'aplatissement. */
  readonly overflows: readonly Drawing[];
  /** Les champs dont le commentaire a été retiré, faute de place. */
  readonly withoutComment: readonly string[];
};

/**
 * Écrit `entries` dans le formulaire `template` et rend le PDF résultant.
 *
 * Un champ qui porte un widget sur plusieurs volets s'écrit une seule fois, et
 * les volets restent cohérents par construction.
 *
 * Un texte n'est jamais coupé, et ne bloque jamais le PDF (D-85). Il s'écrit à
 * la taille visée, puis réduite. S'il ne tient toujours pas, il perd son
 * commentaire. S'il ne tient toujours pas, son champ reste vide : il se
 * dessinera sous son cadre (`overflow.ts`).
 */
export async function fillCerfa(
  template: Uint8Array | ArrayBuffer,
  entries: readonly FieldEntry[],
  { singleLineFields = [] }: FillOptions = {},
): Promise<Filled> {
  const document = await PDFDocument.load(template);
  checkBoxes(document, entries.filter(isBox));
  const texts = entries.filter(isText).map(oneLineIn(singleLineFields));
  const written = await writeTexts(document, texts);
  showValues(document);
  return { pdf: await document.save(), ...written };
}

// ---- implémentation ----

type Form = ReturnType<PDFDocument["getForm"]>;

type Box = { readonly field: string; readonly checked: string };

type Text = {
  readonly field: string;
  readonly text: string;
  readonly comment?: string;
};

type Written = Omit<Filled, "pdf">;

function isBox(entry: FieldEntry): entry is Box {
  return "checked" in entry;
}

function isText(entry: FieldEntry): entry is Text {
  return "text" in entry;
}

function checkBoxes(document: PDFDocument, boxes: readonly Box[]): void {
  const form = document.getForm();
  for (const { field, checked } of boxes) check(form, field, checked);
}

// Un texte destiné à un champ de `singleLineFields` s'aplatit sur une ligne,
// son commentaire aussi.
function oneLineIn(singleLineFields: readonly string[]) {
  return (entry: Text): Text =>
    singleLineFields.includes(entry.field)
      ? {
          ...entry,
          text: flatten(entry.text),
          ...(entry.comment === undefined
            ? {}
            : { comment: flatten(entry.comment) }),
        }
      : entry;
}

/**
 * Un gabarit déclare sa police (`/Cour 10 Tf`, par exemple). Mais
 * `showValues` redessine tout champ écrit dans la police par défaut de
 * `pdf-lib`, Helvetica. Le texte se mesure donc dans cette police-là.
 */
async function writeTexts(
  document: PDFDocument,
  texts: readonly Text[],
): Promise<Written> {
  const font = await document.embedFont(StandardFonts.Helvetica);
  const written = texts.map((text) => ({
    field: text.field,
    ...writeText(document, font, text),
  }));
  return {
    overflows: written.flatMap(({ overflows }) => overflows),
    withoutComment: written
      .filter(({ withoutComment }) => withoutComment)
      .map(({ field }) => field),
  };
}

// Sans cet appel, les valeurs sont dans le PDF mais ne s'affichent pas dans les
// lecteurs qui ne régénèrent pas les apparences.
function showValues(document: PDFDocument): void {
  document.getForm().updateFieldAppearances();
}

// Le texte et son commentaire, sinon le texte seul, dans son champ. Sinon,
// rien dans le champ : le texte se dessinera sous son cadre.
function writeText(
  document: PDFDocument,
  font: PDFFont,
  { field: name, text, comment = "" }: Text,
): { overflows: readonly Drawing[]; withoutComment: boolean } {
  const field = document.getForm().getField(name);
  if (!(field instanceof PDFTextField)) {
    throw new Error(`Le champ « ${name} » n'est pas un champ texte.`);
  }
  const full = [text, comment].filter((part) => part !== "").join(" ; ");
  const fullSize = sizeInField(field, font, full);
  if (fullSize !== undefined) {
    write(field, full, fullSize);
    return { overflows: [], withoutComment: false };
  }
  const withoutComment = comment !== "";
  const size = withoutComment ? sizeInField(field, font, text) : undefined;
  if (size !== undefined) {
    write(field, text, size);
    return { overflows: [], withoutComment };
  }
  const widgets = field.acroField.getWidgets();
  return {
    overflows: overflowsOf(document, widgets, font, text),
    withoutComment,
  };
}

function write(field: PDFTextField, text: string, fontSize: number): void {
  field.setText(text);
  field.setFontSize(fontSize);
}

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

/** Les champs `singleLineFields` n'affichent qu'une ligne, on aplatit. */
function flatten(text: string): string {
  return text
    .replace(/\s*\n+\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}
