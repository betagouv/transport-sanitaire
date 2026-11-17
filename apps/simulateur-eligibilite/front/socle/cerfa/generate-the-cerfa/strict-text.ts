// Un texte strict (D-302) : il tient dans son champ à la taille visée, ou il
// ne s'écrit pas. Sa mesure est celle de l'écriture : le champ du gabarit,
// passé en multiligne, sa marge, Helvetica, et la mise en lignes de `pdf-lib`
// (`text-fit.ts`). La génération et l'éditeur de l'écran la partagent.
//
// Le maximum est celui du compteur « caractères saisis / maximum », compté en
// points de code (spec médicale § 8). Pour un texte qui déborde, c'est la
// longueur de son plus long début qui tient. Pour un texte qui tient, c'est sa
// longueur, plus la place qui reste estimée par un texte de remplissage : une
// indication, jamais une limite.

import type { PDFFont, PDFTextField } from "pdf-lib";
import { fitsAtSize } from "./text-fit";
import { TEXT_SIZES } from "./text-sizes";
import { writableIn } from "./writable-text";
import { write } from "./write-a-text";

/** Ce que la mesure dit d'un texte strict. */
export type StrictMeasure = {
  readonly fits: boolean;
  readonly maximum: number;
};

export class StrictText {
  readonly #field: PDFTextField;
  readonly #font: PDFFont;

  constructor(field: PDFTextField, font: PDFFont) {
    field.enableMultiline();
    this.#field = field;
    this.#font = font;
  }

  /** Ce texte tient-il, et combien de caractères la cellule en prendrait. */
  measure(text: string): StrictMeasure {
    const characters = Array.from(text);
    if (this.#fits(text))
      return { fits: true, maximum: characters.length + this.#room(text) };
    const prefix = (length: number) => characters.slice(0, length).join("");
    const maximum = largest((length) => this.#fits(prefix(length)));
    return { fits: false, maximum: Math.min(maximum, characters.length - 1) };
  }

  /**
   * Écrit le texte s'il tient. Sinon, son plus long début qui tient : le cerfa
   * n'est plus qu'un aperçu.
   */
  write(text: string): StrictMeasure {
    const measured = this.measure(text);
    const written = measured.fits
      ? text
      : Array.from(text).slice(0, measured.maximum).join("");
    write(this.#field, writableIn(this.#font, written), TEXT_SIZES.target);
    return measured;
  }

  // ---- implémentation ----

  #fits(text: string): boolean {
    const writable = writableIn(this.#font, text);
    return fitsAtSize(this.#field, this.#font, writable, TEXT_SIZES.target);
  }

  // Le nombre de caractères de remplissage qui tiennent encore à la suite.
  #room(text: string): number {
    return largest((length) => this.#fits(text + filler(length)));
  }
}

// La plus grande longueur pour laquelle `fits` tient, `fits(0)` tenant : elle
// double jusqu'à ne plus tenir, puis se cherche par dichotomie.
function largest(fits: (length: number) => boolean): number {
  let high = 1;
  while (high <= MAX_SEARCH && fits(high)) high *= 2;
  let low = high / 2;
  if (high === 1) return 0;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (fits(middle)) low = middle;
    else high = middle;
  }
  return Math.min(low, MAX_SEARCH);
}

// Au-delà, la recherche s'arrête : aucune cellule d'un cerfa n'en tient tant.
const MAX_SEARCH = 4096;

// Un remplissage où le texte peut passer à la ligne : « e e e… ».
function filler(length: number): string {
  return Array.from({ length }, (_, index) => (index % 2 ? "e" : " ")).join("");
}
