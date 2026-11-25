// Un texte strict : il tient dans sa place à sa taille, ou il ne
// s'écrit pas. Sa mesure est celle de l'écriture : le champ du gabarit, passé
// en multiligne ou gardé sur une ligne, sa marge, Helvetica, et la mise en
// lignes de `pdf-lib` (`text-fit.service.ts`) ; ou, pour un texte dessiné, sa largeur
// sur une ligne. La génération et l'éditeur de l'écran la partagent.
//
// Le maximum est celui du compteur « caractères saisis / maximum », compté en
// points de code (spec médicale § 8). Pour un texte qui déborde, c'est la
// longueur de son plus long début qui tient. Pour un texte qui tient, c'est sa
// longueur, plus la place qui reste estimée par un texte de remplissage : une
// indication, jamais une limite.

import type { PDFFont, PDFTextField } from "pdf-lib";
import type { StrictLayout, StrictMeasure } from "../cerfa.types";
import type { StrictLineMeasure } from "../cerfa-pdf.types";
import { TextFitService } from "./text-fit.service";
import { WritableTextService } from "./writable-text.service";
import { WriteATextService } from "./write-a-text.service";

/**
 * La mesure d'un texte strict : elle ne sait que dire si un texte tient, et en
 * tire son maximum.
 */
export abstract class StrictMeasurer implements StrictLineMeasure {
  /** Ce texte tient-il, et combien de caractères la place en prendrait. */
  measure(text: string): StrictMeasure {
    const characters = Array.from(text);
    if (this.fits(text))
      return { fits: true, maximum: characters.length + this.#room(text) };
    const prefix = (length: number) => characters.slice(0, length).join("");
    const maximum = largest((length) => this.fits(prefix(length)));
    return { fits: false, maximum: Math.min(maximum, characters.length - 1) };
  }

  /**
   * Le texte s'il tient. Sinon, son plus long début qui tient : le cerfa n'est
   * plus qu'un aperçu.
   */
  fitting(text: string): StrictMeasure & { readonly written: string } {
    const measured = this.measure(text);
    const written = measured.fits
      ? text
      : Array.from(text).slice(0, measured.maximum).join("");
    return { ...measured, written };
  }

  protected abstract fits(text: string): boolean;

  // Le nombre de caractères de remplissage qui tiennent encore à la suite.
  #room(text: string): number {
    return largest((length) => this.fits(text + filler(length)));
  }
}

/** Un texte strict dans son champ du gabarit. */
export class StrictText extends StrictMeasurer {
  readonly #field: PDFTextField;
  readonly #font: PDFFont;
  readonly #layout: StrictLayout;

  constructor(field: PDFTextField, font: PDFFont, layout: StrictLayout) {
    super();
    if (layout.oneLine) field.disableMultiline();
    else field.enableMultiline();
    this.#field = field;
    this.#font = font;
    this.#layout = layout;
  }

  /** Écrit le texte s'il tient, sinon son plus long début qui tient. */
  write(text: string): StrictMeasure {
    const { written, ...measured } = this.fitting(text);
    WriteATextService.write(
      this.#field,
      WritableTextService.in(this.#font, written),
      this.#layout.size,
    );
    return measured;
  }

  protected fits(text: string): boolean {
    if (this.#layout.oneLine && BREAK.test(text)) return false;
    const writable = WritableTextService.in(this.#font, text);
    return TextFitService.fitsAtSize(
      this.#field,
      this.#font,
      writable,
      this.#layout.size,
    );
  }
}

/**
 * Un texte strict dessiné là où le gabarit n'a pas de champ : sur une ligne de
 * `width`, à sa taille.
 */
export class StrictLine extends StrictMeasurer {
  readonly #font: PDFFont;
  readonly #width: number;
  readonly #size: number;

  constructor(font: PDFFont, width: number, size: number) {
    super();
    this.#font = font;
    this.#width = width;
    this.#size = size;
  }

  protected fits(text: string): boolean {
    if (BREAK.test(text)) return false;
    const writable = WritableTextService.in(this.#font, text);
    return this.#font.widthOfTextAtSize(writable, this.#size) <= this.#width;
  }
}

// ---- implémentation ----

// Un retour à la ligne ne s'imprime pas sur une ligne (T06, R04).
const BREAK = /[\r\n]/;

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
