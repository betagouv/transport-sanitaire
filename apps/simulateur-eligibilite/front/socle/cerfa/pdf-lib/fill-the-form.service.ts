// Remplit un formulaire PDF (AcroForm) à partir d'entrées.
//
// Ce fichier ne fait que l'écriture. Ce qu'il faut écrire se décide d'après le
// DTO du cerfa (`generate-the-cerfa.usecase.ts`).
//
// Il n'importe rien de `node:*` : le PDF se génère dans le navigateur, et les
// données du patient ne quittent pas le poste.

import { PDFDocument, type PDFFont, StandardFonts } from "pdf-lib";
import type {
  FieldEntry,
  Filled,
  FillOptions,
  PdfBytes,
} from "../cerfa-pdf.types";
import { BoxAppearancesService } from "./box-appearances.service";
import { type Box, CheckBoxService } from "./check-box.service";
import { FieldDateService } from "./field-date.service";
import { StrictText } from "./strict-text.service";
import { WritableTextService } from "./writable-text.service";
import {
  type Text,
  WriteATextService,
  type WrittenText,
} from "./write-a-text.service";

export class FillTheFormService {
  /**
   * Écrit `entries` dans le formulaire `template` et rend le PDF résultant.
   *
   * Un champ qui porte un widget sur plusieurs volets s'écrit une seule fois, et
   * les volets restent cohérents par construction.
   *
   * Un texte n'est jamais coupé, et ne bloque jamais le PDF. Il s'écrit à
   * la taille visée, puis réduite, puis rapetissé à la ligne jusqu'au plancher.
   * Au-delà, il laisse le champ vide et se dessine sous son cadre, à la plus
   * grande taille jusqu'au plancher où il en reste près (`overflow.service.ts`) ;
   * sinon il rapetisse sous le plancher : illisible plutôt que sur la ligne
   * suivante du formulaire. Plus long que le nombre de caractères du champ, il
   * laisse toujours le champ vide. Un texte strict, lui, s'écrit à sa taille ou
   * en partie (`strict-text.service.ts`).
   */
  static async fill(
    template: PdfBytes,
    entries: readonly FieldEntry[],
    { singleLineFields = [], dateFields = [] }: FillOptions = {},
  ): Promise<Filled> {
    const document = await PDFDocument.load(template);
    BoxAppearancesService.keep(document);
    CheckBoxService.checkAll(document, entries.filter(isBox));
    const texts = entries
      .filter(isText)
      .map(oneLineIn(singleLineFields))
      .map(asDateIn(document, dateFields));
    const written = await writeTexts(document, texts);
    showValues(document);
    return { pdf: await document.save(), ...written };
  }
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
    const boxCount =
      WriteATextService.fieldOf(document, entry.field).getMaxLength() ?? 10;
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
    return WriteATextService.text(document, font, {
      ...text,
      text: WritableTextService.in(font, text.text),
    });
  const field = WriteATextService.fieldOf(document, text.field);
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
