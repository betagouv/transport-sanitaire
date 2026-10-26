// Le téléchargement de la feuille en PDF. Le PDF se prépare au clic, sur la
// feuille telle qu'elle est affichée, comme le bouton de l'éditeur : pendant
// ce temps, l'action attend. Un PDF arrivé après qu'on a quitté la feuille ne
// sort pas (pdf-preparation.ts). Un échec se dit ; un nouveau clic réessaie.

import { type RefObject, useRef, useState } from "react";
import { download, fileNameOf } from "../cerfa/generate-cerfa";
import { useShown } from "../cerfa/pdf-preparation";

/** Où en est le téléchargement. */
export type DownloadStatus = "idle" | "preparing" | "failed";

export function useSheetDownload(sheet: RefObject<HTMLElement | null>) {
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const preparing = useRef(false);
  const shown = useShown();
  const save = async () => {
    if (preparing.current || !sheet.current) return;
    preparing.current = true;
    setStatus("preparing");
    const pdf = await prepared(sheet.current);
    preparing.current = false;
    if (!shown.current) return;
    if (pdf !== FAILED) download(pdf, fileNameOf("fiche-patient", new Date()));
    setStatus(pdf === FAILED ? "failed" : "idle");
  };
  return { status, save };
}

// ---- implémentation ----

const FAILED = "failed";

// Une préparation qui ne rejette jamais : son échec est un état de l'écran.
async function prepared(sheet: HTMLElement): Promise<Blob | typeof FAILED> {
  try {
    const { sheetPdf } = await import("./sheet-pdf");
    return await sheetPdf(sheet);
  } catch (cause) {
    console.error("[feuille] PDF impossible.", cause);
    return FAILED;
  }
}
