// Le document d'un cerfa : l'état de sa génération, ses deux actions,
// l'imprimer et le télécharger, puis son aperçu.
//
// Le PDF se génère une fois, dès que le document s'affiche, dans le
// navigateur : les deux actions et l'aperçu portent le même document. Le texte
// du résultat ne vient qu'avec un PDF prêt, non vide. Avant, « Génération du
// document en cours… » tient sa place ; après un échec, l'alerte, et le clic
// réessaie sans reprendre l'ancien PDF (NAV-ETATS-R3-001, D-250). Un
// commentaire retiré faute de place s'annonce avant toute action (D-85).
// Pendant la génération, les deux actions attendent, et « Télécharger » dit
// « Préparation du PDF ». Une action qui attend un PDF ne se fait plus si le
// document a été quitté entre-temps (`pdf/PdfActionButton.tsx`).
// « Imprimer » vient avant « Télécharger » : côte à côte s'ils tiennent, l'un
// sous l'autre sinon, le groupe en ligne du DSFR passant à la ligne sans
// couper un libellé (D-173). Qui l'affiche peut donner de quoi tenir la place
// de l'aperçu, et ce qui précède le tout, selon que le PDF est prêt ou non.
//
// Le DTO se lit une fois : celui d'un résultat ne change pas tant qu'il est
// affiché. Qui l'affiche apprend chaque PDF prêt et chaque génération ratée,
// une fois par tentative.

import { type ReactNode, useEffect, useRef, useState } from "react";
import { CerfaPreview } from "./CerfaPreview";
import type { Cerfa, CerfaDto } from "./cerfa";
import {
  type GeneratedCerfa,
  generateCerfa,
} from "./generate-the-cerfa/generate-the-cerfa";
import { download, fileNameOf } from "./pdf/download-a-pdf";
import { PdfActionButton, useShown } from "./pdf/PdfActionButton";
import { printPdf } from "./pdf/print-a-pdf";

type Props<Dto extends CerfaDto> = {
  cerfa: Cerfa<Dto>;
  dto: Dto;
  /** La date du document, qui date aussi le nom du fichier. */
  date: Date;
  printLabel: string;
  downloadLabel: string;
  /** Le texte du résultat, qui ne vient qu'une fois le PDF prêt. */
  text?: ReactNode;
  /** Ce qui se montre à la place de l'aperçu. Sans lui, l'aperçu du PDF. */
  standIn?: ReactNode;
  /** Ce qui précède le document, selon que son PDF est prêt ou non. */
  above?: (ready: boolean) => ReactNode;
  /** Le PDF est prêt, et affiché. */
  onReady?: () => void;
  /** Une génération a échoué. */
  onFailure?: () => void;
};

export function CerfaDocument<Dto extends CerfaDto>({
  cerfa,
  dto,
  date,
  printLabel,
  downloadLabel,
  text,
  standIn,
  above,
  onReady,
  onFailure,
}: Props<Dto>) {
  const { settled, withPdf } = useDownloadablePdf(cerfa, dto);
  useSignals(settled, { onReady, onFailure });
  const print = usePrint();
  const save = (pdf: Blob) => download(pdf, fileNameOf(cerfa.fileName, date));
  const ready = settled?.status === "ready";
  return (
    <div className="fr-mb-4w fr-no-print">
      <Generation settled={settled} text={text} />
      {above?.(ready)}
      {ready && settled.removedComments.length > 0 && <RemovedComment />}
      <PdfActions
        withPdf={withPdf}
        print={print}
        save={save}
        printLabel={printLabel}
        downloadLabel={downloadLabel}
      />
      {standIn ??
        (settled?.status === "ready" && <CerfaPreview pdf={settled.pdf} />)}
    </div>
  );
}

// ---- implémentation ----

type Settled = ({ status: "ready" } & GeneratedCerfa) | { status: "failed" };

// Une génération qui ne rejette jamais : son échec est un état de l'écran. Un
// PDF vide n'est pas prêt.
function generate<Dto extends CerfaDto>(
  cerfa: Cerfa<Dto>,
  dto: Dto,
): Promise<Settled> {
  return generateCerfa(cerfa, dto).then(
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

// Le PDF du cerfa, généré dès le montage. `withPdf` le passe à une action, et
// le génère à nouveau si la première tentative a échoué : l'action attend alors
// le PDF, et ne se fait pas si le document n'est plus affiché. `withPdf` manque
// tant que la génération se fait attendre.
function useDownloadablePdf<Dto extends CerfaDto>(cerfa: Cerfa<Dto>, dto: Dto) {
  const [downloadablePdf, setDownloadablePdf] = useState(() =>
    generate(cerfa, dto),
  );
  const settled = useSettled(downloadablePdf);
  const shown = useShown();
  async function ready(): Promise<Settled> {
    if (settled?.status === "ready") return settled;
    const retry = generate(cerfa, dto);
    setDownloadablePdf(retry);
    return retry;
  }
  async function withPdf(action: (pdf: Blob) => void) {
    const result = await ready();
    if (result.status === "ready" && shown.current) action(result.pdf);
  }
  return { settled, withPdf: settled === undefined ? undefined : withPdf };
}

/** Ce qui est attendu n'est pas encore arrivé. */
type Pending = undefined;

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

// Chaque issue arrivée, une fois : une nouvelle tentative en donne une autre.
function useSignals(
  settled: Settled | Pending,
  { onReady, onFailure }: Pick<Props<CerfaDto>, "onReady" | "onFailure">,
) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: un signal par issue arrivée
  useEffect(() => {
    if (settled?.status === "ready") onReady?.();
    if (settled?.status === "failed") onFailure?.();
  }, [settled]);
}

const GENERATING = "Génération du document en cours…";

// L'état de la génération, à la place du texte du résultat : en cours, échouée,
// ou prête, et le texte vient. La région d'état reste posée, vide hors de
// l'attente, pour que les lecteurs d'écran entendent chaque nouvelle attente.
function Generation({
  settled,
  text,
}: {
  settled: Settled | Pending;
  text: ReactNode;
}) {
  const pending = settled === undefined;
  return (
    <>
      <p className={pending ? undefined : "fr-sr-only"} role="status">
        {pending ? GENERATING : ""}
      </p>
      {settled?.status === "failed" && <Failure />}
      {settled?.status === "ready" && text}
    </>
  );
}

// L'impression en cours : un nouveau clic la remplace, et quitter le résultat
// retire son cadre.
type ActionsProps = {
  withPdf: ((use: (pdf: Blob) => void) => void) | undefined;
  print: (pdf: Blob) => void;
  save: (pdf: Blob) => void;
  printLabel: string;
  downloadLabel: string;
};

// Imprimer et télécharger, en attente tant que le PDF n'est pas prêt.
function PdfActions({
  withPdf,
  print,
  save,
  printLabel,
  downloadLabel,
}: ActionsProps) {
  return (
    <ul className="fr-btns-group fr-btns-group--inline fr-btns-group--icon-left">
      <li>
        <PdfActionButton
          className="fr-btn fr-icon-printer-line"
          waiting={!withPdf}
          onClick={() => withPdf?.(print)}
        >
          {printLabel}
        </PdfActionButton>
      </li>
      <li>
        <PdfActionButton
          className="fr-btn fr-icon-download-line"
          waiting={!withPdf}
          saysPreparing
          onClick={() => withPdf?.(save)}
        >
          {downloadLabel}
        </PdfActionButton>
      </li>
    </ul>
  );
}

function usePrint(): (pdf: Blob) => void {
  const release = useRef<() => void>(undefined);
  useEffect(() => () => release.current?.(), []);
  return (pdf) => {
    release.current?.();
    release.current = printPdf(pdf);
  };
}

function Failure() {
  return (
    <div
      className="fr-alert fr-alert--error fr-alert--sm fr-mb-2w"
      role="alert"
    >
      <p>La génération du document a échoué. Réessayez.</p>
    </div>
  );
}

function RemovedComment() {
  return (
    <div className="fr-alert fr-alert--warning fr-alert--sm fr-mb-2w">
      <p>
        Le commentaire facultatif ne tient pas sur le document : il n'y figure
        pas. Raccourcissez-le pour qu'il y figure.
      </p>
    </div>
  );
}
