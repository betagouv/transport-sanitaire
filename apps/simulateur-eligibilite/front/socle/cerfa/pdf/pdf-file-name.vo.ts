// Le nom d'un PDF téléchargé, cerfa ou feuille : sa racine, puis la date du
// document.

export class PdfFileName {
  readonly #root: string;
  readonly #date: Date;

  constructor(root: string, date: Date) {
    this.#root = root;
    this.#date = date;
  }

  /** Le nom du fichier : sa racine, puis la date du document, en `.pdf`. */
  get value(): string {
    // La locale suédoise écrit la date en `AAAA-MM-JJ`, qui se trie.
    const day = this.#date.toLocaleDateString("sv-SE", {
      timeZone: "Europe/Paris",
    });
    return `${this.#root}-${day}.pdf`;
  }
}
