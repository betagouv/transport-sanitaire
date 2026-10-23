// L'impression de la feuille en papier. Au clic sur « Imprimer », la mesure
// attend les polices et les dessins, la feuille prend la mise en page décidée,
// puis le dialogue s'ouvre. Une impression lancée par le navigateur (Ctrl+P,
// son menu) passe par `beforeprint`, qui mesure tout de suite. La feuille
// quitte le papier à `afterprint`.

import { type RefObject, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { measureSheet, measureWhenStable } from "./sheet-measure";
import type { NotPrinting, PrintLayout } from "./sheet-pagination";

type PaperPrint = {
  /** La mise en page que la feuille porte, le temps d'une impression. */
  layout: PrintLayout | NotPrinting;
  print: () => Promise<void>;
};

export function usePaperPrint(
  sheet: RefObject<HTMLElement | null>,
): PaperPrint {
  const [layout, setLayout] = useState<PrintLayout | NotPrinting>(null);
  const preparing = useRef(false);
  useEffect(() => {
    // Le clic a déjà posé sa mesure : `beforeprint` ne la reprend pas.
    const before = () => {
      if (preparing.current || !sheet.current) return;
      const measured = measureSheet(sheet.current);
      flushSync(() => setLayout(measured));
    };
    const after = () => {
      preparing.current = false;
      setLayout(null);
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, [sheet]);
  const print = async () => {
    if (preparing.current || !sheet.current) return;
    preparing.current = true;
    const measured = await measureWhenStable(sheet.current);
    // La feuille a pu partir pendant l'attente : rien ne s'imprime.
    if (!sheet.current?.isConnected) return;
    flushSync(() => setLayout(measured));
    window.print();
  };
  return { layout, print };
}
