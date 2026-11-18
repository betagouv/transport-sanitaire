// Lire une page du journal des parcours, pour le tableau de bord qui
// l'exploite. Une page n'a jamais plus de `MAX_PAGE_SIZE` entrées.

import type {
  Cursor,
  FromTheStart,
  JournalPage,
  JournalPages,
} from "./journal-pages.port.ts";

export const MAX_PAGE_SIZE = 1000;

export class ReadAPage {
  readonly #pages: JournalPages;

  constructor(pages: JournalPages) {
    this.#pages = pages;
  }

  execute(after: Cursor | FromTheStart, size: number): Promise<JournalPage> {
    return this.#pages.pageAfter(after, Math.min(size, MAX_PAGE_SIZE));
  }
}
