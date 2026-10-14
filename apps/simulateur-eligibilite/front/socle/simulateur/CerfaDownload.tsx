// Le téléchargement du cerfa, sous le second résultat : l'action principale.
//
// Le PDF se produit au clic, dans le navigateur. Un échec se signale sans
// masquer le résultat déjà affiché.

import { useState } from "react";
import { download, fileNameOf, produceCerfa } from "../cerfa/produce-cerfa";
import type { CerfaForm, CerfaInput, Model } from "../model";

type Props = { cerfa: Model["cerfa"]; input: CerfaInput };

/** Rien quand la préconisation ne donne aucun cerfa. */
export function CerfaDownload({ cerfa, input }: Props) {
  const form = cerfa.form(input.cibles);
  return (
    form && (
      <DownloadButton form={form} input={input} label={cerfa.downloadLabel} />
    )
  );
}

// ---- implémentation ----

function DownloadButton({
  form,
  input,
  label,
}: Omit<Props, "cerfa"> & { form: CerfaForm; label: string }) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onClick() {
    setPending(true);
    setFailed(false);
    try {
      const pdf = await produceCerfa(form, input);
      download(pdf, fileNameOf(form.fileName, input.completedAt));
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
