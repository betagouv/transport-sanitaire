// Le téléchargement d'un PDF prêt, cerfa ou feuille : le clic sur un lien
// éphémère. Son nom daté vient de `pdf-file-name.vo.ts`.

export class DownloadAPdfService {
  /** Déclenche le téléchargement de `blob` sous `name`, puis libère son URL. */
  static download(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}
