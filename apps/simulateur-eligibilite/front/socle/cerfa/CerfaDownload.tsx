// Le bouton qui télécharge un cerfa.
//
// Le PDF se génère dès que le bouton s'affiche, dans le navigateur : un
// commentaire retiré faute de place s'annonce avant tout téléchargement (D-85).
// Un échec se signale sans masquer ce que la page affiche déjà, et le clic
// réessaie.
//
// Le DTO se lit une fois : celui d'un résultat ne change pas tant qu'il est
// affiché.

import { useEffect, useState } from "react";
import type { Cerfa, CerfaDto } from "./cerfa";
import {
  download,
  fileNameOf,
  type GeneratedCerfa,
  generateCerfa,
} from "./generate-cerfa";

type Props<Dto extends CerfaDto> = {
  cerfa: Cerfa<Dto>;
  dto: Dto;
  /** La date du document, qui date aussi le nom du fichier. */
  date: Date;
  label: string;
};

export function CerfaDownload<Dto extends CerfaDto>({
  cerfa,
  dto,
  date,
  label,
}: Props<Dto>) {
  const { settled, ready } = useDownloadablePdf(cerfa, dto);

  async function onClick() {
    const result = await ready();
    if (result.status === "ready")
      download(result.pdf, fileNameOf(cerfa.fileName, date));
  }

  return (
    <div className="fr-mb-4w fr-no-print">
      {settled?.status === "failed" && <Failure />}
      {settled?.status === "ready" && settled.removedComments.length > 0 && (
        <RemovedComment />
      )}
      <button
        type="button"
        className="fr-btn fr-icon-download-line fr-btn--icon-left"
        onClick={onClick}
        disabled={settled === undefined}
      >
        {settled === undefined ? "Génération en cours…" : label}
      </button>
    </div>
  );
}

// ---- implémentation ----

type Settled = ({ status: "ready" } & GeneratedCerfa) | { status: "failed" };

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

// Le PDF du cerfa, généré dès le montage. `ready` le rend, et le génère à
// nouveau si la première tentative a échoué.
function useDownloadablePdf<Dto extends CerfaDto>(cerfa: Cerfa<Dto>, dto: Dto) {
  const [downloadablePdf, setDownloadablePdf] = useState(() =>
    generate(cerfa, dto),
  );
  const settled = useSettled(downloadablePdf);
  async function ready(): Promise<Settled> {
    if (settled?.status === "ready") return settled;
    const retry = generate(cerfa, dto);
    setDownloadablePdf(retry);
    return retry;
  }
  return { settled, ready };
}

// L'issue de `downloadablePdf`, `undefined` tant qu'elle se fait attendre.
function useSettled(downloadablePdf: Promise<Settled>): Settled | undefined {
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
