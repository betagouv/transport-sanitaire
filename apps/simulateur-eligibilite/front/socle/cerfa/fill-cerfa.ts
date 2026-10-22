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
import { keepBoxAppearances } from "./box-appearances";
import { formatDateForField } from "./dates";
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
  /** Champs qui reçoivent une date ISO, à écrire selon leurs cases. */
  readonly dateFields?: readonly string[];
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
  { singleLineFields = [], dateFields = [] }: FillOptions = {},
): Promise<Filled> {
  const document = await PDFDocument.load(template);
  keepBoxAppearances(document);
  checkBoxes(document, entries.filter(isBox));
  const texts = entries
    .filter(isText)
    .map(oneLineIn(singleLineFields))
    .map(asDateIn(document, dateFields));
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

// Une date ISO destinée à un champ de `dateFields` s'écrit selon ses cases : un
// champ sans limite en a dix.
function asDateIn(document: PDFDocument, dateFields: readonly string[]) {
  return (entry: Text): Text => {
    if (!dateFields.includes(entry.field)) return entry;
    const boxCount = textFieldOf(document, entry.field).getMaxLength() ?? 10;
    return { ...entry, text: formatDateForField(entry.text, boxCount) };
  };
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

type WrittenText = {
  readonly overflows: readonly Drawing[];
  readonly withoutComment: boolean;
};

// Le texte et son commentaire, sinon le texte seul, dans son champ. Sinon,
// rien dans le champ : le texte se dessinera sous son cadre.
function writeText(
  document: PDFDocument,
  font: PDFFont,
  entry: Text,
): WrittenText {
  const field = textFieldOf(document, entry.field);
  return (
    writeWithComment(field, font, entry) ??
    writeWithoutComment(field, font, entry) ??
    overflow(document, field, font, entry)
  );
}

function textFieldOf(document: PDFDocument, name: string): PDFTextField {
  const field = document.getForm().getField(name);
  if (!(field instanceof PDFTextField)) {
    throw new Error(`Le champ « ${name} » n'est pas un champ texte.`);
  }
  return field;
}

/** Rien n'est écrit dans le champ : l'étape suivante essaie autrement. */
type NotWritten = undefined;

// Le texte suivi de son commentaire, s'il tient dans le cadre.
function writeWithComment(
  field: PDFTextField,
  font: PDFFont,
  { text, comment = "" }: Text,
): WrittenText | NotWritten {
  const full = [text, comment].filter((part) => part !== "").join(" ; ");
  return writeIfFits(field, font, full)
    ? { overflows: [], withoutComment: false }
    : undefined;
}

// Le texte seul, son commentaire retiré, s'il tient dans le cadre.
function writeWithoutComment(
  field: PDFTextField,
  font: PDFFont,
  { text, comment }: Text,
): WrittenText | NotWritten {
  if (!comment) return undefined;
  return writeIfFits(field, font, text)
    ? { overflows: [], withoutComment: true }
    : undefined;
}

// Rien dans le champ : le texte, sans son commentaire, se dessinera sous
// chaque widget.
function overflow(
  document: PDFDocument,
  field: PDFTextField,
  font: PDFFont,
  { text, comment }: Text,
): WrittenText {
  const widgets = field.acroField.getWidgets();
  return {
    overflows: overflowsOf(document, widgets, font, text),
    withoutComment: Boolean(comment),
  };
}

// Écrit `text` à la plus grande taille où il tient dans le cadre, s'il y en a
// une.
function writeIfFits(
  field: PDFTextField,
  font: PDFFont,
  text: string,
): boolean {
  const fontSize = sizeInField(field, font, text);
  if (fontSize === undefined) return false;
  field.setText(text);
  field.setFontSize(fontSize);
  return true;
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
