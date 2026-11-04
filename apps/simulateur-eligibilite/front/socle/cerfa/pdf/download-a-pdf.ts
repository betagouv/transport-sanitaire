// Le téléchargement d'un PDF prêt, cerfa ou feuille : son nom daté, puis le
// clic sur un lien éphémère.

/** Nomme le fichier : sa racine, puis la date du document. */
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
