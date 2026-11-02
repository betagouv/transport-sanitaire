// Ce que montre un PDF aplati : les champs qui y restent, les textes dessinés,
// page par page ou à la place d'un champ du gabarit, et les cases marquées.

import {
  decodePDFRawStream,
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  type PDFObject,
  type PDFPage,
  PDFRawStream,
} from "pdf-lib";

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
 * Les textes dessinés sur la page `number`, comptée depuis 1 : ceux des champs
 * aplatis et ceux dessinés hors champ.
 */
export async function textsOn(
  pdf: Uint8Array,
  number: number,
): Promise<string[]> {
  const page = (await PDFDocument.load(pdf)).getPage(number - 1);
  const objects = page.node
    .Resources()
    ?.lookupMaybe(PDFName.of("XObject"), PDFDict);
  const drawn = (objects?.values() ?? []).map((ref) =>
    page.doc.context.lookup(ref),
  );
  return [...contentsOf(page), ...drawn].flatMap((stream) =>
    stream instanceof PDFRawStream ? textsOf(stream) : [],
  );
}

/**
 * Les états de la case `field` dont l'apparence cochée est dessinée à sa place
 * sur le PDF aplati, sans doublon. Sur la seule page `page`, comptée depuis 1,
 * si elle est donnée.
 */
export async function markedStates(
  template: Uint8Array,
  pdf: Uint8Array,
  field: string,
  page?: number,
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
  const drawn = (await PDFDocument.load(pdf))
    .getPages()
    .filter((_, rank) => page === undefined || rank === page - 1)
    .flatMap(drawnObjects)
    .map(({ object, at }) => `${object} à ${at}`);
  const states = boxes.filter((box) => drawn.includes(box.drawn));
  return [...new Set(states.map(({ state }) => state))];
}

/**
 * Les textes que le PDF aplati dessine à la place du champ texte `field` du
 * gabarit, widget après widget. Un même texte dessiné ailleurs n'y compte pas.
 */
export async function textsIn(
  template: Uint8Array,
  pdf: Uint8Array,
  field: string,
): Promise<string[]> {
  const places = (await PDFDocument.load(template))
    .getForm()
    .getField(field)
    .acroField.getWidgets()
    .map((widget) => {
      const { x, y } = widget.getRectangle();
      return `${x},${y}`;
    });
  const document = await PDFDocument.load(pdf);
  return document
    .getPages()
    .flatMap(drawnObjects)
    .filter(({ at }) => places.includes(at))
    .flatMap(({ object }) => {
      const stream = object && document.context.lookup(object);
      return stream instanceof PDFRawStream ? textsOf(stream) : [];
    });
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

// Les objets qu'une page dessine, et où : `12 0 R` à « 20,210 ». L'aplatissement
// de `pdf-lib` glisse une rotation entre le placement et le dessin.
function drawnObjects(page: PDFPage): { object?: PDFObject; at: string }[] {
  const objects = page.node
    .Resources()
    ?.lookupMaybe(PDFName.of("XObject"), PDFDict);
  return contentsOf(page).flatMap((stream) => {
    const content = new TextDecoder("latin1").decode(
      decodePDFRawStream(stream).decode(),
    );
    return [
      ...content.matchAll(/1 0 0 1 ([\d.-]+) ([\d.-]+) cm[^/Q]*\/(\S+) Do/g),
    ].map(([, x, y, name = ""]) => ({
      object: objects?.get(PDFName.of(name)),
      at: `${Number(x)},${Number(y)}`,
    }));
  });
}

// Les flux de contenu de la page.
function contentsOf(page: PDFPage): PDFRawStream[] {
  const contents = page.node.Contents();
  const refs = contents instanceof PDFArray ? contents.asArray() : [contents];
  return refs.flatMap((ref) => {
    const stream = ref && page.doc.context.lookup(ref);
    return stream instanceof PDFRawStream ? [stream] : [];
  });
}
