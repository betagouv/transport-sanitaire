// Un formulaire PDF fabriqué pour les tests, et de quoi relire un PDF rempli.
// Pas de gabarit réel : on connaît la taille et les états de chaque champ.

import {
  decodePDFRawStream,
  PDFArray,
  PDFCheckBox,
  PDFDict,
  PDFDocument,
  PDFName,
  type PDFPage,
  PDFRawStream,
  PDFTextField,
} from "pdf-lib";

/**
 * Un formulaire à cinq champs : `nom` sur une ligne, `nir` limité à treize
 * caractères, `motif` multiligne et étroit, la case `ald`, et `acc`, trois
 * cases sous un même nom (`lait`, `sucre`, `citron`), comme les cases groupées
 * de la DAP.
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
  sharedBoxes(form.createCheckBox("acc"), page, ["lait", "sucre", "citron"]);

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

/**
 * Les états de la case `field` dont l'apparence cochée est dessinée à sa place
 * sur le PDF aplati, sans doublon.
 */
export async function markedStates(
  template: Uint8Array,
  pdf: Uint8Array,
  field: string,
): Promise<string[]> {
  const boxes = (await PDFDocument.load(template))
    .getForm()
    .getField(field)
    .acroField.getWidgets()
    .flatMap((widget) => {
      const normal = widget.getAppearances()?.normal;
      if (!(normal instanceof PDFDict)) return [];
      const { x, y } = widget.getRectangle();
      return normal
        .keys()
        .filter((state) => state !== PDFName.of("Off"))
        .map((state) => ({
          state: state.asString().slice(1),
          drawn: `${normal.get(state)} à ${x},${y}`,
        }));
    });
  const drawn = (await PDFDocument.load(pdf)).getPages().flatMap(drawnObjects);
  const states = boxes.filter((box) => drawn.includes(box.drawn));
  return [...new Set(states.map(({ state }) => state))];
}

// ---- implémentation ----

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

// Une case par état, sous un même nom : on renomme l'état « coché » de chaque
// widget, que `pdf-lib` crée tous sous le même nom.
function sharedBoxes(box: PDFCheckBox, page: PDFPage, states: string[]) {
  for (const [rank] of states.entries())
    box.addToPage(page, { x: 20 + 30 * rank, y: 210, width: 12, height: 12 });
  for (const [rank, widget] of box.acroField.getWidgets().entries()) {
    const appearances = widget.dict.lookup(PDFName.of("AP"), PDFDict);
    for (const kind of ["N", "D"]) {
      const dict = appearances.lookup(PDFName.of(kind), PDFDict);
      const on = dict.keys().find((key) => key !== PDFName.of("Off"));
      if (!on) continue;
      const stream = dict.get(on);
      dict.delete(on);
      if (stream) dict.set(PDFName.of(states[rank] ?? ""), stream);
    }
  }
}

// Les objets qu'une page dessine, et où : « 12 0 R à 20,210 ». L'aplatissement
// de `pdf-lib` glisse une rotation entre le placement et le dessin.
function drawnObjects(page: PDFPage): string[] {
  const objects = page.node
    .Resources()
    ?.lookupMaybe(PDFName.of("XObject"), PDFDict);
  const contents = page.node.Contents();
  const streams =
    contents instanceof PDFArray ? contents.asArray() : [contents];
  return streams.flatMap((ref) => {
    const stream = ref && page.doc.context.lookup(ref);
    if (!(stream instanceof PDFRawStream)) return [];
    const content = new TextDecoder("latin1").decode(
      decodePDFRawStream(stream).decode(),
    );
    return [
      ...content.matchAll(/1 0 0 1 ([\d.-]+) ([\d.-]+) cm[^/Q]*\/(\S+) Do/g),
    ].map(
      ([, x, y, name = ""]) =>
        `${objects?.get(PDFName.of(name))} à ${Number(x)},${Number(y)}`,
    );
  });
}
