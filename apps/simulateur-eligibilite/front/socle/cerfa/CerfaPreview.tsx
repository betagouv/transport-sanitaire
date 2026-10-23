// L'aperçu d'un cerfa : le PDF même que ses actions impriment et téléchargent,
// montré dans la page par le lecteur PDF du navigateur.
//
// Un navigateur sans lecteur intégré (la plupart des téléphones) ne montre
// rien : une phrase renvoie alors au téléchargement. Rien de l'aperçu ne
// s'imprime avec la page : « Imprimer » imprime le document lui-même.

import { useEffect, useState } from "react";

export function CerfaPreview({ pdf }: { pdf: Blob }) {
  const url = useObjectUrl(pdf);
  return (
    url && (
      <object
        data={url}
        type="application/pdf"
        title="Aperçu du document"
        className="fr-no-print"
        style={{
          display: "block",
          width: "100%",
          aspectRatio: "210 / 297",
          maxHeight: "90vh",
          border: "1px solid var(--border-default-grey)",
        }}
      >
        <p>
          Ce navigateur ne montre pas l'aperçu du document : téléchargez-le pour
          le consulter.
        </p>
      </object>
    )
  );
}

// ---- implémentation ----

/** L'URL n'est pas encore créée : l'aperçu attend son premier rendu. */
type NoUrlYet = undefined;

// L'URL du PDF, libérée quand l'aperçu le quitte.
function useObjectUrl(pdf: Blob): string | NoUrlYet {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const created = URL.createObjectURL(pdf);
    setUrl(created);
    return () => URL.revokeObjectURL(created);
  }, [pdf]);
  return url;
}
