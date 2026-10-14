// Produit un cerfa rempli et le propose au téléchargement.
//
// Le cerfa ne sait pas d'où viennent ses données : le simulateur lui en donne,
// une autre source le pourrait. `Input` est ce que lit son mapping.
//
// `pdf-lib` et le gabarit ne se chargent qu'ici, au clic : le chunk d'entrée
// n'en porte rien, et `scripts/verifier-bundle.ts` le vérifie.

import { entriesFrom, type FieldMapping } from "./field-mapping";

/** Un cerfa à remplir : son gabarit, son nom de fichier, et ce qu'on y écrit. */
export type CerfaForm<Input> = {
  /**
   * Charge le gabarit vierge, au clic. Qui le fournit dit d'où il vient : un
   * asset servi par l'app (`templateAt`), ou un formulaire fabriqué.
   */
  template: () => Promise<ArrayBuffer | Uint8Array>;
  /** Le début du nom du fichier téléchargé. `fileNameOf` y ajoute la date. */
  fileName: string;
  mapping: FieldMapping<Input>;
};

/** Le cerfa rempli d'après `input`, prêt à télécharger. */
export async function produceCerfa<Input>(
  form: CerfaForm<Input>,
  input: Input,
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

/** Le nom du fichier : sa racine, puis la date du document. */
export function fileNameOf(root: string, date: Date): string {
  // La locale suédoise écrit la date en `AAAA-MM-JJ`, qui se trie.
  const day = date.toLocaleDateString("sv-SE", {
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
