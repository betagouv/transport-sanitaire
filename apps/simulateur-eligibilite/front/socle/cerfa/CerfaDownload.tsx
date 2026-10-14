// Le bouton qui télécharge un cerfa.
//
// Le PDF se produit dès que le bouton s'affiche, dans le navigateur : un
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
  type Produced,
  produceCerfa,
} from "./produce-cerfa";

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
  const [downloadablePdf, setDownloadablePdf] = useState(() =>
    produce(cerfa, dto),
  );
  const settled = useSettled(downloadablePdf);

  async function onClick() {
    let result = settled;
    if (result?.status !== "ready") {
      const retry = produce(cerfa, dto);
      setDownloadablePdf(retry);
      result = await retry;
    }
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

type Settled = ({ status: "ready" } & Produced) | { status: "failed" };

// Une production qui ne rejette jamais : son échec est un état de l'écran.
function produce<Dto extends CerfaDto>(
  cerfa: Cerfa<Dto>,
  dto: Dto,
): Promise<Settled> {
  return produceCerfa(cerfa, dto).then(
    (produced) => ({ status: "ready", ...produced }),
    (cause) => {
      console.error("[cerfa] Génération impossible.", cause);
      return { status: "failed" };
    },
  );
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
