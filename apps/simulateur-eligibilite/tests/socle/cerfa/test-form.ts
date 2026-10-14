// Un formulaire PDF fabriqué pour les tests, et de quoi relire un PDF rempli.
// Pas de gabarit réel : on connaît la taille et les états de chaque champ.

import {
  decodePDFRawStream,
  PDFCheckBox,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
  PDFTextField,
} from "pdf-lib";

/**
 * Un formulaire à quatre champs : `nom` sur une ligne, `nir` limité à treize
 * caractères, `motif` multiligne et étroit, et la case `ald`.
 */
export async function testForm(): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const page = document.addPage([400, 400]);
  const form = document.getForm();

  const box = { x: 20, width: 200, height: 16 };
  form.createTextField("nom").addToPage(page, { ...box, y: 360 });
  const nir = form.createTextField("nir");
  nir.setMaxLength(13);
  nir.addToPage(page, { ...box, y: 330 });
  const motif = form.createTextField("motif");
  motif.enableMultiline();
  motif.addToPage(page, { x: 20, y: 270, width: 120, height: 30 });
  form.createCheckBox("ald").addToPage(page, { x: 20, y: 240 });

  return document.save();
}

/** Le bon de commande du modèle factice : trois champs sur une ligne. */
export async function bonDeCommande(): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const page = document.addPage([400, 200]);
  const form = document.getForm();
  for (const [rang, nom] of ["commande", "quantite", "date"].entries())
    form
      .createTextField(nom)
      .addToPage(page, { x: 20, y: 150 - 40 * rang, width: 300, height: 16 });
  return document.save();
}

/** Relit un PDF rempli et rend `{ nom du champ → valeur }`, champs vides exclus. */
export async function readBack(
  pdf: Uint8Array,
): Promise<Record<string, string>> {
  const form = (await PDFDocument.load(pdf)).getForm();
  const read: Record<string, string> = {};
  for (const field of form.getFields()) {
    if (field instanceof PDFTextField) {
      const text = field.getText();
      if (text) read[field.getName()] = text;
    } else if (field instanceof PDFCheckBox) {
      const state = field.acroField.dict.get(PDFName.of("V"));
      if (state) read[field.getName()] = state.toString();
    }
  }
  return read;
}

/** Les états d'apparence qu'un champ sait rendre, `/Off` exclu, dans l'ordre. */
export async function statesOf(
  pdf: Uint8Array,
  name: string,
): Promise<string[]> {
  const field = (await PDFDocument.load(pdf)).getForm().getField(name);
  const states = field.acroField.getWidgets().flatMap((widget) => {
    const appearances = widget.getAppearances()?.normal;
    return appearances instanceof PDFDict
      ? appearances
          .keys()
          .map((key) => String(key).slice(1))
          .filter((key) => key !== "Off")
      : [];
  });
  return [...new Set(states)];
}

/** La taille de police d'un champ texte, telle que son `/DA` la déclare. */
export async function fontSizeOf(
  pdf: Uint8Array,
  name: string,
): Promise<number> {
  const field = (await PDFDocument.load(pdf)).getForm().getTextField(name);
  const fontSize = field.acroField.getDefaultAppearance()?.match(/([\d.]+) Tf/);
  return Number(fontSize?.[1]);
}

/**
 * Ce qu'un PDF aplati montre : le nombre de champs qui y restent, et les textes
 * dessinés, dans l'ordre où le fichier les range.
 */
export async function drawnOn(
  pdf: Uint8Array,
): Promise<{ fields: number; texts: string[] }> {
  const document = await PDFDocument.load(pdf);
  const texts = document.context
    .enumerateIndirectObjects()
    .flatMap(([, object]) =>
      object instanceof PDFRawStream ? textsOf(object) : [],
    );
  return { fields: document.getForm().getFields().length, texts };
}

// Les textes qu'un flux dessine. `pdf-lib` les écrit en hexadécimal, encodés
// en WinAnsi, qui ne diffère pas de Latin-1 pour les lettres accentuées.
function textsOf(stream: PDFRawStream): string[] {
  const content = new TextDecoder("latin1").decode(
    decodePDFRawStream(stream).decode(),
  );
  return [...content.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)].map(([, hex = ""]) =>
    new TextDecoder("latin1").decode(
      Uint8Array.from(hex.match(/../g) ?? [], (byte) => parseInt(byte, 16)),
    ),
  );
}
