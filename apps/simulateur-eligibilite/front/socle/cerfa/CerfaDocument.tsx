// Le document d'un cerfa : l'état de sa génération, ses deux actions,
// l'imprimer et le télécharger, puis son aperçu.
//
// Le PDF se génère une fois, dès que le document s'affiche, dans le
// navigateur : les deux actions et l'aperçu portent le même document. Le texte
// du résultat ne vient qu'avec un PDF prêt, non vide. Avant, « Génération du
// document en cours… » tient sa place ; après un échec, l'alerte, et le clic
// réessaie sans reprendre l'ancien PDF (NAV-ETATS-R3-001).
// Un texte strict qui ne tient pas ouvre son éditeur au-dessus des actions
// (`StrictTexts.tsx`) : le PDF n'est plus qu'un aperçu marqué, et les
// deux actions attendent, sans texte du résultat, jusqu'à ce que qui l'affiche
// remonte le document avec le texte validé. Les brouillons présents au
// montage font aussi du PDF un aperçu. Pendant la génération, les deux actions
// attendent, et « Télécharger » dit « Préparation du PDF ». Une action qui
// attend un PDF ne se fait plus si le document a été quitté entre-temps
// (`downloadable-pdf.hook.ts`).
// « Imprimer » vient avant « Télécharger » : côte à côte s'ils tiennent, l'un
// sous l'autre sinon, le groupe en ligne du DSFR passant à la ligne sans
// couper un libellé. Qui l'affiche peut donner de quoi tenir la place
// de l'aperçu, et ce qui précède le tout, selon que le PDF est prêt ou non.
//
// Le DTO se lit une fois : celui d'un résultat ne change pas tant qu'il est
// affiché. Qui l'affiche apprend chaque PDF prêt et chaque génération ratée,
// une fois par tentative, et le PDF prêt retiré. Il apprend chaque clic sur un
// PDF prêt, puis l'impression ou le téléchargement lancés, et le PDF remis au
// navigateur. Un clic qui relance une génération ratée ne se signale pas : ce
// qu'il lance, une fois le document prêt, si.

import { type ReactNode, useEffect, useRef } from "react";
import type { CerfaDto } from "../../../core/socle/cerfa";
import { CerfaPreview } from "./CerfaPreview";
import type { Cerfa, Typography } from "./cerfa.types";
import {
  type PdfAction,
  type Pending,
  type Settled,
  useAwaitedAction,
  useDownloadablePdf,
} from "./downloadable-pdf.hook";
import { DownloadAPdfService } from "./pdf/download-a-pdf.service";
import { PdfActionButton, type PdfSignals } from "./pdf/PdfActionButton";
import { PdfFileName } from "./pdf/pdf-file-name.vo";
import { PrintAPdfService } from "./pdf/print-a-pdf.service";
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
  /** Le PDF prêt n'est plus affiché : en édition, régénéré, ou quitté. */
  onWithdrawn?: () => void;
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
  onWithdrawn,
  signals = {},
  edits = NO_EDITS,
}: Props<Dto>) {
  const preview = Object.keys(edits.drafts).length > 0;
  const { settled, retry, awaited } = useDownloadablePdf(cerfa, dto, preview);
  const generated = settled?.status === "ready" ? settled : undefined;
  const editors = editorsOf(cerfa, dto, edits.drafts, generated?.overflowing);
  const editing = preview || editors.length > 0;
  useSignals(editing ? undefined : settled, { onReady, onFailure });
  const ready = generated !== undefined && !editing;
  const signal = ready ? signals : {};
  const act = useAct(signal, new PdfFileName(cerfa.fileName, date).value);
  useAwaitedAction(awaited, ready ? generated?.pdf : undefined, act);
  useWithdrawal(ready, onWithdrawn);
  const onAction = (action: PdfAction) =>
    generated ? act(action, generated.pdf) : retry(action);
  return (
    <div className="fr-mb-4w fr-no-print">
      <Generation settled={settled} text={editing ? null : text} />
      {above?.(ready)}
      <StrictTexts cerfa={cerfa} editors={editors} edits={edits} />
      <PdfActions
        onAction={editing || !settled ? undefined : onAction}
        suspended={editing}
        printLabel={printLabel}
        downloadLabel={downloadLabel}
        signals={signal}
      />
      {standIn ?? (generated && <CerfaPreview pdf={generated.pdf} />)}
    </div>
  );
}

// ---- implémentation ----

// L'impression ou le téléchargement du PDF, et ce qui s'en signale.
function useAct(signal: PdfSignals, fileName: string) {
  const print = usePrint();
  return (action: PdfAction, pdf: Blob) => {
    if (action === "print") {
      signal.onPrintLaunched?.();
      print(pdf);
      return;
    }
    signal.onDownloadLaunched?.();
    DownloadAPdfService.download(pdf, fileName);
    signal.onDownloaded?.();
  };
}

// Le PDF prêt retiré : il passe en édition, se régénère, ou le document se
// quitte.
function useWithdrawal(ready: boolean, onWithdrawn?: () => void) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: un retrait par PDF prêt
  useEffect(() => {
    if (ready) return () => onWithdrawn?.();
  }, [ready]);
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
  /** L'action sur le PDF ; aucune tant qu'il se fait attendre. */
  onAction: ((action: PdfAction) => void) | undefined;
  /** Un texte se réécrit : les actions attendent sans « Préparation du PDF ». */
  suspended: boolean;
  printLabel: string;
  downloadLabel: string;
  signals: PdfSignals;
};

// Imprimer et télécharger, en attente tant que le PDF n'est pas prêt.
function PdfActions({
  onAction,
  suspended,
  printLabel,
  downloadLabel,
  signals,
}: ActionsProps) {
  return (
    <ul className="fr-btns-group fr-btns-group--inline fr-btns-group--icon-left">
      <li>
        <PdfActionButton
          className="fr-btn fr-icon-printer-line"
          waiting={!onAction}
          onClick={() => {
            signals.onPrint?.();
            onAction?.("print");
          }}
        >
          {printLabel}
        </PdfActionButton>
      </li>
      <li>
        <PdfActionButton
          className="fr-btn fr-icon-download-line"
          waiting={!onAction}
          saysPreparing={!suspended}
          onClick={() => {
            signals.onDownload?.();
            onAction?.("download");
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
    release.current = PrintAPdfService.print(pdf);
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
