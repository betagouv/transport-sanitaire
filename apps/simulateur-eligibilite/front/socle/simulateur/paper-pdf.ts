// Le PDF de la feuille, à partir de ses pages en images : une A4 par page,
// l'image posée aux marges des gabarits, comme à l'impression (@page de
// sheet-viewer-print.css). pdf-lib se charge à la demande.

/** Une page de la feuille, photographiée : sa JPEG et sa hauteur en mm. */
export type PageImage = { jpeg: Uint8Array; height: number };

export async function paperPdf(pages: readonly PageImage[]): Promise<Blob> {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  for (const { jpeg, height } of pages) {
    const image = await pdf.embedJpg(jpeg);
    pdf.addPage([points(A4.width), points(A4.height)]).drawImage(image, {
      x: points(MARGIN.left),
      y: points(A4.height - MARGIN.top - height),
      width: points(A4.width - 2 * MARGIN.left),
      height: points(height),
    });
  }
  // `save` donne une vue typée trop large pour `BlobPart` : on la repasse
  // telle quelle.
  return new Blob([(await pdf.save()) as BlobPart], {
    type: "application/pdf",
  });
}

// ---- implémentation ----

const A4 = { width: 210, height: 297 };

// Les marges des gabarits : 9 mm en haut et en bas, 10 mm sur les côtés.
const MARGIN = { top: 9, left: 10 };

function points(millimetres: number): number {
  return (millimetres * 72) / 25.4;
}
