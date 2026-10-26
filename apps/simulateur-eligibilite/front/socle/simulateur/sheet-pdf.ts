// La feuille à remettre en PDF, préparée dans le navigateur sur la feuille
// affichée. Elle se mesure comme pour l'impression (sheet-measure.ts) ; sa
// copie en papier, à la mise en page retenue, est photographiée, puis coupée
// là où l'impression coupe les pages (sheet-pagination.ts). Chaque tranche va
// sur une A4 (paper-pdf.ts). Le PDF est une image : son texte ne se
// sélectionne pas.

import { type PageImage, paperPdf } from "./paper-pdf";
import { measureWhenStable, onPaperCopy } from "./sheet-measure";
import { type PageSlice, pageSlicesOf } from "./sheet-pagination";
import { photograph } from "./sheet-photo";

export async function sheetPdf(sheet: HTMLElement): Promise<Blob> {
  const layout = await measureWhenStable(sheet);
  return onPaperCopy(sheet, layout, async (paper) => {
    const slices = pageSlicesOf(layout, paper);
    // Une feuille sans hauteur donnerait un PDF blanc : c'est un échec.
    if (slices.length === 0) throw new Error("La feuille ne se mesure pas.");
    const photo = await photograph(paper.copy, SCALE);
    return paperPdf(await Promise.all(slices.map((s) => cut(photo, s))));
  });
}

// ---- implémentation ----

// Trois pixels d'image par pixel CSS : près de 290 points par pouce, de quoi
// garder le texte net à l'impression du PDF.
const SCALE = 3;

const JPEG_QUALITY = 0.92;

// La largeur de la photo, en millimètres : celle de la copie en papier.
const PAPER_WIDTH = 190;

// La tranche `slice` de la photo, en JPEG.
async function cut(
  photo: HTMLCanvasElement,
  slice: PageSlice,
): Promise<PageImage> {
  const perMm = photo.width / PAPER_WIDTH;
  const top = Math.round(slice.top * perMm);
  const height = Math.min(Math.round(slice.height * perMm), photo.height - top);
  const page = document.createElement("canvas");
  page.width = photo.width;
  page.height = height;
  const context = page.getContext("2d");
  if (!context) throw new Error("Le navigateur ne dessine pas la page.");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, page.width, height);
  context.drawImage(photo, 0, -top);
  return { jpeg: await jpegOf(page), height: height / perMm };
}

async function jpegOf(page: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) =>
    page.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new Error("Le navigateur n'encode pas la page.");
  return new Uint8Array(await blob.arrayBuffer());
}
