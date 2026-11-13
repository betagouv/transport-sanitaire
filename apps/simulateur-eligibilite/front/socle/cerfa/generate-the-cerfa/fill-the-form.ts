// Remplit un formulaire PDF (AcroForm) à partir d'entrées.
//
// Ce fichier ne fait que l'écriture. Ce qu'il faut écrire se décide d'après le
// DTO du cerfa (`generate-the-cerfa.ts`).
//
// Il n'importe rien de `node:*` : le PDF se génère dans le navigateur, et les
// données du patient ne quittent pas le poste.

import { PDFDocument, type PDFFont, StandardFonts } from "pdf-lib";
import { keepBoxAppearances } from "./box-appearances";
import { type Box, checkBoxes } from "./check-box";
import { formatDateForField } from "./dates";
import type { Drawing } from "./flatten-the-form";
import { writableIn } from "./writable-text";
import { type Text, textFieldOf, writeText } from "./write-a-text";

/**
 * Une valeur à écrire : un texte dans un champ nommé, ou une case à cocher.
 *
 * Un texte peut porter un commentaire facultatif, écrit à sa suite : la seule
 * chose qui se retire quand le texte ne tient pas dans son cadre (D-85).
 *
 * `checked` porte l'état d'export à écrire, souvent `On` ou `Yes`. Un gabarit
 * peut aussi mettre plusieurs cases sous un même nom : des boutons radio
 * déguisés, dont chaque widget porte un seul état. La casse compte (`/OUI`,
 * `/Oui`) : les états se relèvent dans le gabarit, ils ne se devinent pas.
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
  /**
   * Champs à passer en multiligne avant toute mesure, même si le gabarit les
   * déclare sur une ligne : ceux qui portent un commentaire
   * (DOC-COMMENTAIRE-CAPACITE-20261104, #356).
   */
  readonly multilineFields?: readonly string[];
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
  /**
   * La taille à laquelle chaque texte s'imprime, en points, par nom de champ :
   * dans son cadre, ou dessiné dessous. Un champ sans widget n'y est pas.
   */
  readonly sizes: ReadonlyMap<string, number>;
};

/**
 * Écrit `entries` dans le formulaire `template` et rend le PDF résultant.
 *
 * Un champ qui porte un widget sur plusieurs volets s'écrit une seule fois, et
 * les volets restent cohérents par construction.
 *
 * Un texte n'est jamais coupé, et ne bloque jamais le PDF (D-85). Il s'écrit à
 * la taille visée, puis réduite, puis sans son commentaire, puis rapetissé à la
 * ligne jusqu'au plancher (D-193). Au-delà, il laisse le champ vide et se
 * dessine sous son cadre, à la plus grande taille jusqu'au plancher où il en
 * reste près (`overflow.ts`, #341) ; sinon il rapetisse sous le plancher :
 * illisible plutôt que sur la ligne suivante du formulaire. Plus long que le
 * nombre de caractères du champ, il laisse toujours le champ vide.
 */
export async function fillCerfa(
  template: Uint8Array | ArrayBuffer,
  entries: readonly FieldEntry[],
  {
    singleLineFields = [],
    multilineFields = [],
    dateFields = [],
  }: FillOptions = {},
): Promise<Filled> {
  const document = await PDFDocument.load(template);
  keepBoxAppearances(document);
  for (const field of multilineFields)
    document.getForm().getTextField(field).enableMultiline();
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

type Written = Omit<Filled, "pdf">;

function isBox(entry: FieldEntry): entry is Box {
  return "checked" in entry;
}

function isText(entry: FieldEntry): entry is Text {
  return "text" in entry;
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

// Un gabarit déclare sa police (`/Cour 10 Tf`, par exemple). Mais `showValues`
// redessine tout champ écrit dans la police par défaut de `pdf-lib`,
// Helvetica. Le texte se mesure donc dans cette police-là.
async function writeTexts(
  document: PDFDocument,
  texts: readonly Text[],
): Promise<Written> {
  const font = await document.embedFont(StandardFonts.Helvetica);
  const written = texts.map(writableWith(font)).map((text) => ({
    field: text.field,
    ...writeText(document, font, text),
  }));
  return {
    overflows: written.flatMap(({ overflows }) => overflows),
    withoutComment: written
      .filter(({ withoutComment }) => withoutComment)
      .map(({ field }) => field),
    sizes: new Map(
      written.flatMap(({ field, size }) =>
        size === null ? [] : [[field, size]],
      ),
    ),
  };
}

// Un texte et son commentaire, réduits à ce que `font` sait écrire.
function writableWith(font: PDFFont) {
  return ({ comment, ...entry }: Text): Text => ({
    ...entry,
    text: writableIn(font, entry.text),
    ...(comment === undefined ? {} : { comment: writableIn(font, comment) }),
  });
}

// Sans cet appel, les valeurs sont dans le PDF mais ne s'affichent pas dans les
// lecteurs qui ne régénèrent pas les apparences.
function showValues(document: PDFDocument): void {
  document.getForm().updateFieldAppearances();
}

/** Les champs `singleLineFields` n'affichent qu'une ligne, on aplatit. */
function flatten(text: string): string {
  return text
    .replace(/\s*\n+\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}
