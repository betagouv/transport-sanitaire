// Les données qui traversent le port du PDF (`cerfa-pdf.port.ts`) : ce que le
// cerfa demande qu'on écrive, qu'on dessine, et ce que le PDF lui rend. Aucun
// type de la bibliothèque PDF n'y figure : le cerfa n'en connaît aucune.

import type { Position, StrictLayout, StrictMeasure } from "./cerfa.types";

/** Le gabarit vierge, tel que le cerfa le charge. */
export type PdfBytes = ArrayBuffer | Uint8Array;

/**
 * Une valeur à écrire : un texte dans un champ nommé, ou une case à cocher.
 * Un texte strict s'écrit à sa taille, ou pas.
 *
 * `checked` porte l'état d'export à écrire, souvent `On` ou `Yes`. Un gabarit
 * peut aussi mettre plusieurs cases sous un même nom : des boutons radio
 * déguisés, dont chaque widget porte un seul état. La casse compte (`/OUI`,
 * `/Oui`) : les états se relèvent dans le gabarit, ils ne se devinent pas.
 */
export type FieldEntry = { readonly field: string } & (
  | { readonly text: string; readonly strict?: StrictLayout }
  | { readonly checked: string }
);

export type FillOptions = {
  /**
   * Champs déclarés multilignes dans le PDF, mais dont le cadre ne montre qu'une
   * ligne. Un `\n` y ferait disparaître la suite à l'impression : leurs valeurs
   * sont aplaties sur une ligne.
   */
  readonly singleLineFields?: readonly string[];
  /** Champs qui reçoivent une date ISO, à écrire selon leurs cases. */
  readonly dateFields?: readonly string[];
};

/**
 * Un texte à dessiner hors de tout champ, à sa taille. `at.y` est la ligne de
 * base de sa première ligne. Il passe à la ligne dans `at.width`. `singleLine` :
 * il rapetisse d'abord, depuis sa taille, pour tenir sur une ligne.
 */
export type Drawing = {
  readonly text: string;
  readonly at: Position;
  readonly size: number;
  readonly singleLine?: boolean;
};

/** Un texte strict qui déborde de son champ, et son maximum. */
export type StrictOverflow = {
  readonly field: string;
  readonly maximum: number;
};

/** Le PDF rempli, et ce que les champs n'ont pas pu recevoir. */
export type Filled = {
  readonly pdf: Uint8Array;
  /** Les textes trop longs pour leur cadre, à dessiner après l'aplatissement. */
  readonly overflows: readonly Drawing[];
  /**
   * Les textes stricts qui ne tiennent pas, et le maximum de chacun : leur
   * plus long début est écrit, le PDF n'est qu'un aperçu.
   */
  readonly overflowing: readonly StrictOverflow[];
  /**
   * La taille à laquelle chaque texte s'imprime, en points, par nom de champ :
   * dans son cadre, ou dessiné dessous. Un champ sans widget n'y est pas.
   */
  readonly sizes: ReadonlyMap<string, number>;
};

/** Une case à marquer : son champ, et l'état d'export qui la désigne. */
export type Mark = { readonly field: string; readonly state: string };

/** Ce qui se dessine après l'aplatissement. */
export type Drawn = {
  readonly marks?: readonly Mark[];
  readonly drawings?: readonly Drawing[];
  /** La marque d'un aperçu, en travers de chaque page. */
  readonly watermark?: string;
};

/** Le PDF aplati, et la taille de chaque texte dessiné, dans leur ordre. */
export type Flattened = {
  readonly pdf: Uint8Array;
  readonly drawnSizes: readonly number[];
};

/**
 * La mesure d'un texte strict dessiné sur une ligne : le texte s'il tient,
 * sinon son plus long début qui tient. Le cerfa n'est plus qu'un aperçu.
 */
export type StrictLineMeasure = {
  fitting(text: string): StrictMeasure & { readonly written: string };
};

/** Mesure un texte destiné à un texte strict, par son entrée du DTO. */
export type MeasureStrictText = (entry: string, text: string) => StrictMeasure;
