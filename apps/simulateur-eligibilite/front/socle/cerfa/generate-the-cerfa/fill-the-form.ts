// Remplit un formulaire PDF (AcroForm) à partir d'entrées.
//
// Ce fichier ne fait que l'écriture. Ce qu'il faut écrire se décide d'après le
// DTO du cerfa (`generate-the-cerfa.ts`).
//
// Il n'importe rien de `node:*` : le PDF se génère dans le navigateur, et les
// données du patient ne quittent pas le poste.

import { PDFDocument, type PDFFont, StandardFonts } from "pdf-lib";
import type { StrictLayout } from "../cerfa.types";
import { FieldDateService } from "../field-date.service";
import { keepBoxAppearances } from "./box-appearances";
import { type Box, checkBoxes } from "./check-box";
import type { Drawing } from "./flatten-the-form";
import { StrictText } from "./strict-text";
import { writableIn } from "./writable-text";
import {
  type Text,
  textFieldOf,
  type WrittenText,
  writeText,
} from "./write-a-text";

/**
 * Une valeur à écrire : un texte dans un champ nommé, ou une case à cocher.
 * Un texte strict s'écrit à sa taille, ou pas.
 *
 * `checked` porte l'état d'export à écrire, souvent `On` ou `Yes`. Un gabarit
 * peut aussi mettre plusieurs cases sous un même nom : des boutons radio
 * déguisés, dont chaque widget porte un seul état. La casse compte (`/OUI`,
 * `/Oui`) : les états se relèvent dans le gabarit, ils ne se devinent pas.
 */
export type FieldEntry = { readonly field: string } & (
  | { readonly text: string; readonly strict?: StrictLayout }
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
  /**
   * Les textes stricts qui ne tiennent pas, et le maximum de chacun : leur
   * plus long début est écrit, le PDF n'est qu'un aperçu.
   */
  readonly overflowing: readonly StrictOverflow[];
  /**
   * La taille à laquelle chaque texte s'imprime, en points, par nom de champ :
   * dans son cadre, ou dessiné dessous. Un champ sans widget n'y est pas.
   */
  readonly sizes: ReadonlyMap<string, number>;
};

/** Un texte strict qui déborde de son champ, et son maximum. */
export type StrictOverflow = {
  readonly field: string;
  readonly maximum: number;
};

/**
 * Écrit `entries` dans le formulaire `template` et rend le PDF résultant.
 *
 * Un champ qui porte un widget sur plusieurs volets s'écrit une seule fois, et
 * les volets restent cohérents par construction.
 *
 * Un texte n'est jamais coupé, et ne bloque jamais le PDF. Il s'écrit à
 * la taille visée, puis réduite, puis rapetissé à la ligne jusqu'au plancher.
 * Au-delà, il laisse le champ vide et se dessine sous son cadre, à la plus
 * grande taille jusqu'au plancher où il en reste près (`overflow.ts`) ;
 * sinon il rapetisse sous le plancher : illisible plutôt que sur la ligne
 * suivante du formulaire. Plus long que le nombre de caractères du champ, il
 * laisse toujours le champ vide. Un texte strict, lui, s'écrit à sa taille ou
 * en partie (`strict-text.ts`).
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

type Written = Omit<Filled, "pdf">;

function isBox(entry: FieldEntry): entry is Box {
  return "checked" in entry;
}

function isText(entry: FieldEntry): entry is Text {
  return "text" in entry;
}

// Un texte destiné à un champ de `singleLineFields` s'aplatit sur une ligne.
function oneLineIn(singleLineFields: readonly string[]) {
  return (entry: Text): Text =>
    singleLineFields.includes(entry.field)
      ? { ...entry, text: flatten(entry.text) }
      : entry;
}

// Une date ISO destinée à un champ de `dateFields` s'écrit selon ses cases : un
// champ sans limite en a dix.
function asDateIn(document: PDFDocument, dateFields: readonly string[]) {
  return (entry: Text): Text => {
    if (!dateFields.includes(entry.field)) return entry;
    const boxCount = textFieldOf(document, entry.field).getMaxLength() ?? 10;
    return { ...entry, text: FieldDateService.format(entry.text, boxCount) };
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
  const written = texts.map((text) => ({
    field: text.field,
    ...writeOne(document, font, text),
  }));
  return {
    overflows: written.flatMap(({ overflows }) => overflows),
    overflowing: written.flatMap(({ field, maximum }) =>
      maximum === undefined ? [] : [{ field, maximum }],
    ),
    sizes: new Map(
      written.flatMap(({ field, size }) =>
        size === null ? [] : [[field, size]],
      ),
    ),
  };
}

// Un texte, réduit à ce que `font` sait écrire. Un texte strict s'y réduit
// lui-même : son maximum se compte sur le texte tel qu'il est saisi.
function writeOne(
  document: PDFDocument,
  font: PDFFont,
  text: Text,
): WrittenText & { maximum?: number } {
  if (!text.strict)
    return writeText(document, font, {
      ...text,
      text: writableIn(font, text.text),
    });
  const field = textFieldOf(document, text.field);
  const strict = new StrictText(field, font, text.strict);
  const { fits, maximum } = strict.write(text.text);
  const size =
    field.acroField.getWidgets().length > 0 ? text.strict.size : null;
  return { overflows: [], size, ...(fits ? {} : { maximum }) };
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
