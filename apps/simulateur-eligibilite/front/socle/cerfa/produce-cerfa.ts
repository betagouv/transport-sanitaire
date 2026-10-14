// Produit le cerfa d'une préconisation et le propose au téléchargement.
//
// `pdf-lib` et le gabarit ne se chargent qu'ici, au clic : le chunk d'entrée
// n'en porte rien, et `scripts/verifier-bundle.ts` le vérifie.

import type { CerfaForm, CerfaInput } from "../model";
import { entriesFrom } from "./field-mapping";

/** Le cerfa rempli, prêt à télécharger. */
export async function produceCerfa(
  form: CerfaForm,
  input: CerfaInput,
): Promise<Blob> {
  const [template, { fillCerfa }] = await Promise.all([
    form.template(),
    import("./fill-cerfa"),
  ]);
  const pdf = await fillCerfa(template, entriesFrom(form.mapping, input));
  // `pdf` est une vue typée trop large pour `BlobPart` : on la repasse telle
  // quelle.
  return new Blob([pdf as BlobPart], { type: "application/pdf" });
}

/**
 * Le chargeur d'un gabarit servi comme asset de l'app : un modèle l'importe par
 * `import url from "./gabarit.pdf?url"`.
 */
export function templateAt(url: string): () => Promise<ArrayBuffer> {
  return async () => {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Gabarit indisponible (HTTP ${response.status}).`);
    return response.arrayBuffer();
  };
}

/** Le nom du fichier : sa racine, puis la date de complétion. */
export function fileNameOf(root: string, completedAt: Date): string {
  // La locale suédoise écrit la date en `AAAA-MM-JJ`, qui se trie.
  const day = completedAt.toLocaleDateString("sv-SE", {
    timeZone: "Europe/Paris",
  });
  return `${root}-${day}.pdf`;
}

/** Déclenche le téléchargement de `blob` sous `name`, puis libère son URL. */
export function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
