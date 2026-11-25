// Le PDF d'un cerfa, généré dès le montage, et ce qu'en font ses deux actions,
// l'imprimer et le télécharger. Une action sur un PDF prêt se fait aussitôt.
// Après un échec, le clic génère à nouveau le PDF : l'action attend la nouvelle
// tentative, puis se fait sur son PDF, une fois le document prêt signalé
// (`useAwaitedAction`). Le document quitté entre-temps ne fait plus rien.

import { type RefObject, useEffect, useRef, useState } from "react";
import type { CerfaDto } from "../../../core/socle/cerfa";
import type { Cerfa } from "./cerfa.types";
import {
  type GeneratedCerfa,
  generateCerfa,
} from "./generate-the-cerfa/generate-the-cerfa";

/** L'issue d'une génération : un PDF prêt, non vide, ou un échec. */
export type Settled =
  | ({ status: "ready" } & GeneratedCerfa)
  | { status: "failed" };

/** Ce qui est attendu n'est pas encore arrivé. */
export type Pending = undefined;

/** Ce qu'une action fait du PDF. */
export type PdfAction = "print" | "download";

/** Aucune action n'attend de PDF. */
type NoAction = null;

/** L'action qu'une nouvelle tentative fait attendre. */
export type AwaitedAction = RefObject<PdfAction | NoAction>;

/**
 * Le PDF, généré dès le montage. `retry` le génère à nouveau, sans aperçu, et y
 * fait attendre une action.
 */
export function useDownloadablePdf<Dto extends CerfaDto>(
  cerfa: Cerfa<Dto>,
  dto: Dto,
  preview: boolean,
) {
  const [downloadablePdf, setDownloadablePdf] = useState(() =>
    generate(cerfa, dto, preview),
  );
  const settled = useSettled(downloadablePdf);
  const awaited: AwaitedAction = useRef<PdfAction | NoAction>(null);
  const retry = (action: PdfAction) => {
    awaited.current = action;
    setDownloadablePdf(generate(cerfa, dto, false));
  };
  return { settled, retry, awaited };
}

/**
 * L'action qu'une nouvelle tentative faisait attendre, faite sur le PDF prêt.
 * À appeler après les signaux du document prêt : `act` est celle du rendu où
 * il l'est.
 */
export function useAwaitedAction(
  awaited: AwaitedAction,
  pdf: Blob | Pending,
  act: (action: PdfAction, pdf: Blob) => void,
) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: une action par PDF prêt
  useEffect(() => {
    const action = awaited.current;
    if (!pdf || !action) return;
    awaited.current = null;
    act(action, pdf);
  }, [pdf]);
}

// ---- implémentation ----

// Une génération qui ne rejette jamais : son échec est un état de l'écran. Un
// PDF vide n'est pas prêt.
function generate<Dto extends CerfaDto>(
  cerfa: Cerfa<Dto>,
  dto: Dto,
  preview: boolean,
): Promise<Settled> {
  return generateCerfa(cerfa, dto, { preview }).then(
    (generated): Settled => {
      if (generated.pdf.size > 0) return { status: "ready", ...generated };
      console.error("[cerfa] Le PDF généré est vide.");
      return { status: "failed" };
    },
    (cause): Settled => {
      console.error("[cerfa] Génération impossible.", cause);
      return { status: "failed" };
    },
  );
}

// L'issue de `downloadablePdf`, une fois arrivée.
function useSettled(downloadablePdf: Promise<Settled>): Settled | Pending {
  const [settled, setSettled] = useState<Settled>();
  useEffect(() => {
    let current = true;
    setSettled(undefined);
    downloadablePdf.then((result) => {
      if (current) setSettled(result);
    });
    return () => {
      current = false;
    };
  }, [downloadablePdf]);
  return settled;
}
