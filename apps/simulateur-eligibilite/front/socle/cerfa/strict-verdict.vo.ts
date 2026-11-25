// Ce que l'écran dit d'un texte strict saisi (T06) : se valide-t-il, et
// sinon, pourquoi. Vide quand il est requis, il est à compléter. Trop long, il
// est à raccourcir, avec le message de sa règle, ou celui de la cellule
// médicale.

import type { Strict, StrictMeasure } from "./cerfa.types";

export class StrictVerdict {
  readonly valid: boolean;
  /** Pourquoi il ne se valide pas. */
  readonly message?: string;

  private constructor(valid: boolean, message?: string) {
    this.valid = valid;
    this.message = message;
  }

  static of(
    strict: Strict,
    text: string,
    measured: StrictMeasure,
  ): StrictVerdict {
    if (strict.requiredMessage && text.trim() === "")
      return new StrictVerdict(false, strict.requiredMessage);
    if (!measured.fits)
      return new StrictVerdict(
        false,
        strict.overflowMessage ?? StrictVerdict.#overflowMessage(strict.label),
      );
    return new StrictVerdict(true);
  }

  // Le message d'un texte strict qui déborde (spec médicale § 8).
  static #overflowMessage(label: string): string {
    return `Raccourcissez le texte présent dans '${label}' pour pouvoir imprimer ou télécharger le document.`;
  }
}
