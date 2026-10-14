// Le bouton qui télécharge un cerfa.
//
// Le PDF se produit au clic, dans le navigateur. Un échec se signale sans
// masquer ce que la page affiche déjà.

import { useState } from "react";
import type { Cerfa, CerfaDto } from "./cerfa";
import { download, fileNameOf, produceCerfa } from "./produce-cerfa";

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
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onClick() {
    setPending(true);
    setFailed(false);
    try {
      const pdf = await produceCerfa(cerfa, dto);
      download(pdf, fileNameOf(cerfa.fileName, date));
    } catch (cause) {
      console.error("[cerfa] Génération impossible.", cause);
      setFailed(true);
    }
    setPending(false);
  }

  return (
    <div className="fr-mb-4w">
      {failed && <Failure />}
      <button
        type="button"
        className="fr-btn fr-icon-download-line fr-btn--icon-left"
        onClick={onClick}
        disabled={pending}
      >
        {pending ? "Génération en cours…" : label}
      </button>
    </div>
  );
}

// ---- implémentation ----

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
