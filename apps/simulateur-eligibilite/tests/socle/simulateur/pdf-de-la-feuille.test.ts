// Le PDF de la feuille : une image par page, posée sur une A4 aux marges des
// gabarits, 10 mm à gauche et 9 mm en haut, sur les 190 mm de la largeur
// utile, à la hauteur de sa tranche. Les images sont de vraies JPEG, relues
// dans le PDF par pdf-lib.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  decodePDFRawStream,
  PDFArray,
  PDFDocument,
  type PDFPage,
  PDFRawStream,
} from "pdf-lib";
import { describe, expect, it } from "vitest";
import { paperPdf } from "../../../front/socle/simulateur/paper-pdf";

describe("le PDF de la feuille", () => {
  it("a une A4 par page", async () => {
    const pdf = await relu(
      await paperPdf([page({ height: 170 }), page({ height: 160 })]),
    );

    expect(pdf.getPages().map((a4) => arrondi(a4.getSize()))).toEqual([
      { width: 595.3, height: 841.9 },
      { width: 595.3, height: 841.9 },
    ]);
  });

  it("pose chaque image aux marges des gabarits, à la hauteur de sa tranche", async () => {
    const pdf = await relu(await paperPdf([page({ height: 170 })]));

    // 190 mm de large et 170 mm de haut, à 10 mm du bord gauche et à
    // 297 − 9 − 170 = 118 mm du bas.
    expect(imagesPosees(pdf)).toEqual([[538.6, 481.9, 28.3, 334.5]]);
  });
});

// ---- implémentation ----

const PAGE_BLANCHE = new Uint8Array(
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "../fixtures/page-blanche.jpg",
    ),
  ),
);

function page({ height }: { height: number }) {
  return { jpeg: PAGE_BLANCHE, height };
}

async function relu(pdf: Blob) {
  return PDFDocument.load(await pdf.arrayBuffer());
}

function arrondi({ width, height }: { width: number; height: number }) {
  return { width: dixieme(width), height: dixieme(height) };
}

function dixieme(points: number) {
  return Math.round(points * 10) / 10;
}

// Ce que chaque page dessine, en points : largeur, hauteur, gauche et bas de
// chaque image. pdf-lib la place par une suite d'opérateurs `cm`, sans
// rotation, avant `Do` : on y passe les deux coins du carré unité de l'image,
// du dernier opérateur au premier.
function imagesPosees(pdf: PDFDocument) {
  return pdf.getPages().flatMap((a4) =>
    contenuDe(a4)
      .split(/\/\S+ Do/)
      .slice(0, -1)
      .map((avant) => {
        const operateurs = [...avant.matchAll(CM)].map(([, ...n]) =>
          n.map(Number),
        );
        const [x0, y0] = place(operateurs, [0, 0]);
        const [x1, y1] = place(operateurs, [1, 1]);
        return [x1 - x0, y1 - y0, x0, y0].map(dixieme);
      }),
  );
}

const CM = /(-?[\d.]+) 0 0 (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) cm/g;

type Point = [x: number, y: number];

function place(operateurs: number[][], point: Point): Point {
  return operateurs.reduceRight<Point>(
    ([x, y], [a = 1, d = 1, e = 0, f = 0]) => [a * x + e, d * y + f],
    point,
  );
}

// Le texte des flux de contenu de la page.
function contenuDe(a4: PDFPage) {
  const contents = a4.node.Contents();
  const refs = contents instanceof PDFArray ? contents.asArray() : [contents];
  return refs
    .map((ref) => ref && a4.doc.context.lookup(ref))
    .filter((flux) => flux instanceof PDFRawStream)
    .map((flux) =>
      new TextDecoder("latin1").decode(decodePDFRawStream(flux).decode()),
    )
    .join("\n");
}
