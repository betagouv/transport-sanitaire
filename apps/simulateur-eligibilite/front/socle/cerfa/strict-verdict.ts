// Ce que l'écran dit d'un texte strict saisi (D-302, T06) : se valide-t-il, et
// sinon, pourquoi. Vide quand il est requis, il est à compléter. Trop long, il
// est à raccourcir, avec le message de sa règle, ou celui de la cellule
// médicale.

import type { Strict } from "./cerfa";
import type { StrictMeasure } from "./generate-the-cerfa/strict-text";

export type StrictVerdict = {
  readonly valid: boolean;
  /** Pourquoi il ne se valide pas. */
  readonly message?: string;
};

export function verdictOf(
  strict: Strict,
  text: string,
  measured: StrictMeasure,
): StrictVerdict {
  if (strict.requiredMessage && text.trim() === "")
    return { valid: false, message: strict.requiredMessage };
  if (!measured.fits)
    return {
      valid: false,
      message: strict.overflowMessage ?? overflowMessage(strict.label),
    };
  return { valid: true };
}

// Le message d'un texte strict qui déborde (spec médicale § 8).
function overflowMessage(label: string): string {
  return `Raccourcissez le texte présent dans '${label}' pour pouvoir imprimer ou télécharger le document.`;
}
