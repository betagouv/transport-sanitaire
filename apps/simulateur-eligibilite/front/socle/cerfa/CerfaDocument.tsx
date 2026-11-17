// Le document d'un cerfa : l'état de sa génération, ses deux actions,
// l'imprimer et le télécharger, puis son aperçu.
//
// Le PDF se génère une fois, dès que le document s'affiche, dans le
// navigateur : les deux actions et l'aperçu portent le même document. Le texte
// du résultat ne vient qu'avec un PDF prêt, non vide. Avant, « Génération du
// document en cours… » tient sa place ; après un échec, l'alerte, et le clic
// réessaie sans reprendre l'ancien PDF (NAV-ETATS-R3-001, D-250).
// Un texte strict qui ne tient pas ouvre son éditeur au-dessus des actions
// (D-302, `StrictTexts.tsx`) : le PDF n'est plus qu'un aperçu marqué, et les
// deux actions attendent, sans texte du résultat, jusqu'à ce que qui l'affiche
// remonte le document avec le texte validé (D-304). Les brouillons présents au
// montage font aussi du PDF un aperçu. Pendant la génération, les deux actions attendent, et « Télécharger » dit
// « Préparation du PDF ». Une action qui attend un PDF ne se fait plus si le
// document a été quitté entre-temps (`pdf/PdfActionButton.tsx`).
// « Imprimer » vient avant « Télécharger » : côte à côte s'ils tiennent, l'un
// sous l'autre sinon, le groupe en ligne du DSFR passant à la ligne sans
// couper un libellé (D-173). Qui l'affiche peut donner de quoi tenir la place
// de l'aperçu, et ce qui précède le tout, selon que le PDF est prêt ou non.
//
// Le DTO se lit une fois : celui d'un résultat ne change pas tant qu'il est
// affiché. Qui l'affiche apprend chaque PDF prêt et chaque génération ratée,
// une fois par tentative, puis chaque clic sur un PDF prêt et chaque PDF remis
// au navigateur après lui. Un clic qui relance une génération ratée n'agit pas
// encore sur un PDF : il ne se signale pas.

import { type ReactNode, useEffect, useRef, useState } from "react";
import { CerfaPreview } from "./CerfaPreview";
import type { Cerfa, CerfaDto } from "./cerfa";
import {
  type GeneratedCerfa,
  generateCerfa,
} from "./generate-the-cerfa/generate-the-cerfa";
import type { Typography } from "./generate-the-cerfa/typography";
import { download, fileNameOf } from "./pdf/download-a-pdf";
import {
  PdfActionButton,
  type PdfSignals,
  useShown,
} from "./pdf/PdfActionButton";
import { printPdf } from "./pdf/print-a-pdf";
import { editorsOf, type StrictTextEdits, StrictTexts } from "./StrictTexts";

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
  /** Le PDF est prêt, et affiché : la taille de ses textes imprimés. */
  onReady?: (typography: Typography) => void;
  /** Une génération a échoué. */
  onFailure?: () => void;
  signals?: PdfSignals;
  /** Les textes stricts réécrits : sans eux, aucun éditeur ne s'ouvre. */
  edits?: StrictTextEdits;
};

const NO_EDITS: StrictTextEdits = {
  drafts: {},
  onEdit: () => {},
  onValidate: () => {},
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
  signals = {},
  edits = NO_EDITS,
}: Props<Dto>) {
  const preview = Object.keys(edits.drafts).length > 0;
  const { settled, withPdf } = useDownloadablePdf(cerfa, dto, preview);
  const generated = settled?.status === "ready" ? settled : undefined;
  const editors = editorsOf(cerfa, dto, edits.drafts, generated?.overflowing);
  const editing = preview || editors.length > 0;
  useSignals(editing ? undefined : settled, { onReady, onFailure });
  const print = usePrint();
  const ready = generated !== undefined && !editing;
  const signal = ready ? signals : {};
  const save = (pdf: Blob) => {
    download(pdf, fileNameOf(cerfa.fileName, date));
    signal.onDownloaded?.();
  };
  return (
    <div className="fr-mb-4w fr-no-print">
      <Generation settled={settled} text={editing ? null : text} />
      {above?.(ready)}
      <StrictTexts cerfa={cerfa} editors={editors} edits={edits} />
      <PdfActions
        withPdf={editing ? undefined : withPdf}
        suspended={editing}
        print={print}
        save={save}
        printLabel={printLabel}
        downloadLabel={downloadLabel}
        signals={signal}
      />
      {standIn ?? (generated && <CerfaPreview pdf={generated.pdf} />)}
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

// Le PDF du cerfa, généré dès le montage. `withPdf` le passe à une action, et
// le génère à nouveau si la première tentative a échoué : l'action attend alors
// le PDF, et ne se fait pas si le document n'est plus affiché. `withPdf` manque
// tant que la génération se fait attendre.
function useDownloadablePdf<Dto extends CerfaDto>(
  cerfa: Cerfa<Dto>,
  dto: Dto,
  preview: boolean,
) {
  const [downloadablePdf, setDownloadablePdf] = useState(() =>
    generate(cerfa, dto, preview),
  );
  const settled = useSettled(downloadablePdf);
  const shown = useShown();
  async function ready(): Promise<Settled> {
    if (settled?.status === "ready") return settled;
    const retry = generate(cerfa, dto, false);
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
    if (settled?.status === "ready") onReady?.(settled.typography);
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
  /** Un texte se réécrit : les actions attendent sans « Préparation du PDF ». */
  suspended: boolean;
  print: (pdf: Blob) => void;
  save: (pdf: Blob) => void;
  printLabel: string;
  downloadLabel: string;
  signals: PdfSignals;
};

// Imprimer et télécharger, en attente tant que le PDF n'est pas prêt.
function PdfActions({
  withPdf,
  suspended,
  print,
  save,
  printLabel,
  downloadLabel,
  signals,
}: ActionsProps) {
  return (
    <ul className="fr-btns-group fr-btns-group--inline fr-btns-group--icon-left">
      <li>
        <PdfActionButton
          className="fr-btn fr-icon-printer-line"
          waiting={!withPdf}
          onClick={() => {
            signals.onPrint?.();
            withPdf?.(print);
          }}
        >
          {printLabel}
        </PdfActionButton>
      </li>
      <li>
        <PdfActionButton
          className="fr-btn fr-icon-download-line"
          waiting={!withPdf}
          saysPreparing={!suspended}
          onClick={() => {
            signals.onDownload?.();
            withPdf?.(save);
          }}
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
