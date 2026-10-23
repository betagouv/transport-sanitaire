// Le document d'un cerfa : ses deux actions, l'imprimer et le télécharger,
// puis son aperçu.
//
// Le PDF se génère une fois, dès que le document s'affiche, dans le
// navigateur : les deux actions et l'aperçu portent le même document. Un
// commentaire retiré faute de place s'annonce avant toute action (D-85). Un
// échec se signale sans masquer ce que la page affiche déjà, et le clic
// réessaie. Pendant la génération, les deux actions attendent, et
// « Télécharger » dit « Préparation du PDF… », comme le bouton de l'éditeur
// (D-191). Une action qui attend un PDF ne se fait plus si le document a été
// quitté entre-temps : un PDF arrivé après coup ne sort jamais (D-190).
// « Imprimer » vient avant « Télécharger » : côte à côte s'ils tiennent, l'un
// sous l'autre sinon, le groupe en ligne du DSFR passant à la ligne sans
// couper un libellé (D-173). Qui l'affiche peut donner de quoi tenir la place
// de l'aperçu.
//
// Le DTO se lit une fois : celui d'un résultat ne change pas tant qu'il est
// affiché.

import { type ReactNode, useEffect, useRef, useState } from "react";
import { CerfaPreview } from "./CerfaPreview";
import type { Cerfa, CerfaDto } from "./cerfa";
import {
  download,
  fileNameOf,
  type GeneratedCerfa,
  generateCerfa,
} from "./generate-cerfa";
import { printPdf } from "./print-pdf";

type Props<Dto extends CerfaDto> = {
  cerfa: Cerfa<Dto>;
  dto: Dto;
  /** La date du document, qui date aussi le nom du fichier. */
  date: Date;
  printLabel: string;
  downloadLabel: string;
  /** Ce qui se montre à la place de l'aperçu. Sans lui, l'aperçu du PDF. */
  standIn?: ReactNode;
};

export function CerfaDocument<Dto extends CerfaDto>({
  cerfa,
  dto,
  date,
  printLabel,
  downloadLabel,
  standIn,
}: Props<Dto>) {
  const { settled, withPdf } = useDownloadablePdf(cerfa, dto);
  const print = usePrint();
  const save = (pdf: Blob) => download(pdf, fileNameOf(cerfa.fileName, date));
  return (
    <div className="fr-mb-4w fr-no-print">
      <Notices settled={settled} />
      <ul className="fr-btns-group fr-btns-group--inline fr-btns-group--icon-left">
        <ActionButton
          icon="fr-icon-printer-line"
          onClick={withPdf && (() => withPdf(print))}
        >
          {printLabel}
        </ActionButton>
        <ActionButton
          icon="fr-icon-download-line"
          onClick={withPdf && (() => withPdf(save))}
        >
          {settled === undefined ? PREPARING : downloadLabel}
        </ActionButton>
      </ul>
      {standIn ??
        (settled?.status === "ready" && <CerfaPreview pdf={settled.pdf} />)}
    </div>
  );
}

// ---- implémentation ----

type Settled = ({ status: "ready" } & GeneratedCerfa) | { status: "failed" };

const PREPARING = "Préparation du PDF…";

// Une génération qui ne rejette jamais : son échec est un état de l'écran.
function generate<Dto extends CerfaDto>(
  cerfa: Cerfa<Dto>,
  dto: Dto,
): Promise<Settled> {
  return generateCerfa(cerfa, dto).then(
    (generated) => ({ status: "ready", ...generated }),
    (cause) => {
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

// Le document est-il encore affiché ?
function useShown() {
  const shown = useRef(false);
  useEffect(() => {
    shown.current = true;
    return () => {
      shown.current = false;
    };
  }, []);
  return shown;
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

// Ce que la génération annonce, au-dessus des boutons : qu'elle a échoué, ou
// qu'elle a retiré un commentaire. Qu'elle est en cours, seuls les lecteurs
// d'écran l'entendent ici : le bouton « Télécharger » le montre.
function Notices({ settled }: { settled: Settled | Pending }) {
  return (
    <>
      {settled?.status === "failed" && <Failure />}
      {settled?.status === "ready" && settled.removedComments.length > 0 && (
        <RemovedComment />
      )}
      <p className="fr-sr-only" role="status">
        {settled === undefined ? PREPARING : ""}
      </p>
    </>
  );
}

// Une action sur le PDF. Sans `onClick`, le PDF se génère encore : elle attend.
type ActionButtonProps = {
  icon: string;
  onClick: (() => void) | undefined;
  children: string;
};

function ActionButton({ icon, onClick, children }: ActionButtonProps) {
  return (
    <li>
      <button
        type="button"
        className={`fr-btn ${icon}`}
        onClick={onClick}
        disabled={!onClick}
      >
        {children}
      </button>
    </li>
  );
}

// L'impression en cours : un nouveau clic la remplace, et quitter le résultat
// retire son cadre.
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
      <p>
        Le document n'a pas pu être généré. Réessayez, ou remplissez le
        formulaire à la main.
      </p>
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
